document.addEventListener("DOMContentLoaded", () => {
    let participants = [
        { label: "Приз 1", color: "#FFD700", image: null },
        { label: "Приз 2", color: "#FF6F61", image: null }
    ];
    let bonuses = [
        "Станцуй весёлый танец 💃",
        "Расскажи анекдот 😂",
        "Сделай 10 приседаний 🏋"
    ];
    const sectorColors = [
        "#FFD700", "#FF6F61", "#6B5B95",
        "#88B04B", "#F7CAC9", "#92A8D1"
    ];
    let angleMain = 0;
    let angleBonus = 0;
    let spinning = false;

    // Массив доступных участников (меняется по мере игры)
    let availableParticipants = [...participants];
    // История выданных бонусов для каждого участника
    let bonusHistory = {};

    const mainCanvas = document.getElementById("mainWheel");
    const mainCtx = mainCanvas.getContext("2d");
    const bonusCanvas = document.getElementById("bonusWheel");
    const bonusCtx = bonusCanvas.getContext("2d");

    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""),16);
        const amt = Math.round(2.55 * percent);
        return "#" + (
          0x1000000 +
          (Math.max(0, Math.min(255, (num >> 16) - amt))) * 0x10000 +
          (Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) - amt))) * 0x100 +
          (Math.max(0, Math.min(255, (num & 0x0000FF) - amt)))
        ).toString(16).slice(1);
    }
    function lightenColor(color, percent) {
        const num = parseInt(color.replace("#",""),16);
        const amt = Math.round(2.55 * percent);
        return "#" + (
          0x1000000 +
          (Math.max(0, Math.min(255, (num >> 16) + amt))) * 0x10000 +
          (Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt))) * 0x100 +
          (Math.max(0, Math.min(255, (num & 0x0000FF) + amt)))
        ).toString(16).slice(1);
    }

    function drawWheel(ctx, items, angle, size) {
        if (items.length === 0) return;
        ctx.clearRect(0, 0, size, size);
        let arc = 2 * Math.PI / items.length;

        // Обводка
        let borderSegments = 60;
        let borderArc = (2 * Math.PI) / borderSegments;
        for (let i = 0; i < borderSegments; i++) {
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 2, i * borderArc, (i+1) * borderArc);
            ctx.arc(size/2, size/2, size/2 - 15, (i+1) * borderArc, i * borderArc, true);
            ctx.closePath();
            ctx.fillStyle = i % 2 === 0 ? "#ff4444" : "#fff";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Сектора
        items.forEach((sector, i) => {
            let startAngle = arc * i + angle;
            let grad = ctx.createLinearGradient(size/2, size/2, size, size);
            grad.addColorStop(0, lightenColor(sector.color, 30));
            grad.addColorStop(1, darkenColor(sector.color, 20));
            ctx.beginPath();
            ctx.moveTo(size/2, size/2);
            ctx.arc(size/2, size/2, size/2 - 18, startAngle, startAngle + arc);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.save();
            ctx.translate(size/2, size/2);
            ctx.rotate(startAngle + arc / 2);
            ctx.textAlign = "right";
            ctx.font = `bold ${Math.floor(size/18)}px 'Rubik'`;
            ctx.fillStyle = "#000";
            ctx.fillText(sector.label, size/2 - 40, 5);
            ctx.restore();
        });

        // Стрелка
        ctx.beginPath();
        ctx.moveTo(size/2, 8);
        ctx.lineTo(size/2 - 14, 40);
        ctx.lineTo(size/2 + 14, 40);
        ctx.closePath();
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Белый центр
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/9, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 1, 0, 2 * Math.PI);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(255,215,0,0.8)";
        ctx.stroke();
    }

    function getRandomIndex(array) {
        return Math.floor(Math.random() * array.length);
    }

    function spinBothWheels() {
        if (spinning || participants.length === 0 || bonuses.length === 0) return;
        spinning = true;

        let spinAngleMain = Math.random() * 2000 + 2000;
        let spinAngleBonus = Math.random() * 2000 + 2000;
        let duration = 3000;
        let start = performance.now();

        function animate(now) {
            let elapsed = now - start;
            if (elapsed < duration) {
                angleMain += (spinAngleMain / duration) * 16;
                angleBonus -= (spinAngleBonus / duration) * 16;
                drawWheel(mainCtx, availableParticipants, angleMain, mainCanvas.width);
                drawWheel(bonusCtx, bonuses.map((b, i) => ({label: "Бонус", color: sectorColors[i % sectorColors.length]})), angleBonus, bonusCanvas.width);
                requestAnimationFrame(animate);
            } else {
                spinning = false;

                // Если кончились доступные участники — сбрасываем
                if (availableParticipants.length === 0) {
                    availableParticipants = [...participants];
                }

                // Выбор участника
                let winnerIndexLocal = getRandomIndex(availableParticipants);
                let winner = availableParticipants[winnerIndexLocal];
                availableParticipants.splice(winnerIndexLocal, 1);

                // История бонусов для участника
                if (!bonusHistory[winner.label]) {
                    bonusHistory[winner.label] = [];
                }
                // Фильтруем доступные бонусы
                let availableBonuses = bonuses
                    .map((b, i) => ({ index: i, value: b }))
                    .filter(b => !bonusHistory[winner.label].includes(b.index));
                // Если бонусов не осталось — сброс
                if (availableBonuses.length === 0) {
                    bonusHistory[winner.label] = [];
                    availableBonuses = bonuses.map((b, i) => ({ index: i, value: b }));
                }
                let randomBonusObj = availableBonuses[getRandomIndex(availableBonuses)];
                bonusHistory[winner.label].push(randomBonusObj.index);

                // Рисуем финальное состояние
                drawWheel(mainCtx, participants, angleMain, mainCanvas.width);
                drawWheel(bonusCtx, bonuses.map((b, i) => ({label: "Бонус", color: sectorColors[i % sectorColors.length]})), angleBonus, bonusCanvas.width);

                // Попап
                document.getElementById("popupWinner").innerText = `🏆 Победитель: ${winner.label}`;
                document.getElementById("popupBonus").innerText = `🎁 Бонус: ${randomBonusObj.value}`;
                if (winner.image) {
                    const imgEl = document.getElementById("popupImage");
                    imgEl.src = winner.image;
                    imgEl.style.display = "block";
                } else {
                    document.getElementById("popupImage").style.display = "none";
                }
                document.getElementById("winnerPopup").style.display = "flex";
            }
        }
        requestAnimationFrame(animate);
    }

    // Обновления списков
    function updateParticipantList() {
        const list = document.getElementById("participantList");
        list.innerHTML = "";
        participants.forEach((s, i) => {
            const div = document.createElement("div");
            div.classList.add("item");
            div.innerHTML = `<span style="color:${s.color}">●</span> ${s.label} 
                             <button class="deleteBtn" data-index="${i}">Удалить</button>`;
            list.appendChild(div);
        });
        document.querySelectorAll("#participantList .deleteBtn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = parseInt(e.target.dataset.index);
                participants.splice(idx, 1);
                availableParticipants = availableParticipants.filter(p => p.label !== participants[idx]?.label);
                updateParticipantList();
                drawWheel(mainCtx, participants, angleMain, mainCanvas.width);
            });
        });
    }

    function updateBonusList() {
        const list = document.getElementById("bonusList");
        list.innerHTML = "";
        bonuses.forEach((b, i) => {
            const div = document.createElement("div");
            div.classList.add("item");
            div.innerHTML = `${b} <button class="deleteBtn" data-index="${i}">Удалить</button>`;
            list.appendChild(div);
        });
        document.querySelectorAll("#bonusList .deleteBtn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                bonuses.splice(parseInt(e.target.dataset.index), 1);
                updateBonusList();
                drawWheel(bonusCtx, bonuses.map((b, i) => ({label: "Бонус", color: sectorColors[i % sectorColors.length]})), angleBonus, bonusCanvas.width);
            });
        });
    }

    // Формы
    document.getElementById("participantForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("participantName").value.trim();
        const image = document.getElementById("participantImage").value.trim();
        if (name) {
            participants.push({label: name, color: sectorColors[participants.length % sectorColors.length], image: image || null});
            availableParticipants = [...participants];
            document.getElementById("participantName").value = "";
            document.getElementById("participantImage").value = "";
            updateParticipantList();
            drawWheel(mainCtx, participants, angleMain, mainCanvas.width);
        }
    });

    document.getElementById("bonusForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const txt = document.getElementById("bonusTask").value.trim();
        if (txt) {
            bonuses.push(txt);
            document.getElementById("bonusTask").value = "";
            updateBonusList();
            drawWheel(bonusCtx, bonuses.map((b, i) => ({label: "Бонус", color: sectorColors[i % sectorColors.length]})), angleBonus, bonusCanvas.width);
        }
    });

    document.getElementById("spinBtn").addEventListener("click", spinBothWheels);

    // Закрытие попапа
    document.querySelector(".close-btn").addEventListener("click", () => {
        document.getElementById("winnerPopup").style.display = "none";
    });
    document.getElementById("winnerPopup").addEventListener("click", (e) => {
        if (e.target === document.getElementById("winnerPopup")) {
            document.getElementById("winnerPopup").style.display = "none";
        }
    });

    // Первая отрисовка
    updateParticipantList();
    updateBonusList();
    drawWheel(mainCtx, participants, angleMain, mainCanvas.width);
    drawWheel(bonusCtx, bonuses.map((b, i) => ({label: "Бонус", color: sectorColors[i % sectorColors.length]})), angleBonus, bonusCanvas.width);
});