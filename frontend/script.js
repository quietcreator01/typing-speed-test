// STATE
const API_URL = "https://typing-speed-test-7mgp.onrender.com";
let difficulty = "easy";
let mode = "timed";
let passage = "";
let chars = [];
let timer = null;
let elapsedTime = 0;
let timeLimit = 60;
let isTestRunning = false;
let correctChars = 0;
let incorrectChars = 0;
let lastLength = 0;
let pendingScore = null; // holds wpm/accuracy until user clicks Save

// DOM REFS
const textDisplay = document.getElementById("text-display");
const textInput = document.getElementById("text-input");
const textContainer = document.getElementById("text-container");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resultContainer = document.getElementById("result-container");
const wpmStat = document.getElementById("wpm-stat").querySelector("b");
const accuracyStat = document.getElementById("accuracy-stat").querySelector("b");
const timeStat = document.getElementById("time-stat").querySelector("b");
const bestWpmStat = document.getElementById("best-wpm");
const difficultyLabel = document.getElementById("difficulty-label");
const modeLabel = document.getElementById("mode-label");

async function loadPersonalBest() {
    const username = localStorage.getItem("username");
    if (!username) {
        bestWpmStat.textContent = "—";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/api/scores/mine?username=${username}&difficulty=${difficulty}&mode=${mode}`);
        const data = await res.json();
        bestWpmStat.textContent = `${data.wpm} WPM`;
    } catch (err) {
        console.error("Failed to load personal best:", err);
    }
}
loadPersonalBest();

// DIFFICULTY / MODE SETTERS
function setDifficulty(value) {
    difficulty = value;
    document.querySelectorAll(".difficulty-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.difficulty === value);
    });
    document.querySelectorAll('#difficulty-dropdown .dropdown-menu button').forEach(b => {
        b.classList.toggle("active", b.dataset.difficulty === value);
    });
    if(difficultyLabel)
        difficultyLabel.textContent = document.querySelector(`.difficulty-btn[data-difficulty="${value}"]`).textContent.trim();

    if(isTestRunning) 
        restartTest();
    else 
        showPreview();

    loadPersonalBest();
}

function setMode(value) {
    mode = value;
    document.querySelectorAll(".mode-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.mode === value);
    });
    document.querySelectorAll('#mode-dropdown .dropdown-menu button').forEach(b => {
        b.classList.toggle("active", b.dataset.mode === value);
    });
    if(modeLabel)
        modeLabel.textContent = document.querySelector(`.mode-btn[data-mode="${value}"]`).textContent.trim();

    if(isTestRunning) 
        restartTest();
    else 
        showPreview();

    loadPersonalBest();
}

// UI EVENT WIRING (dropdowns, pill buttons, start/restart)
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
}

document.querySelectorAll(".difficulty-btn").forEach(btn => {
    btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

document.querySelectorAll(".dropdown-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
        const dropdown = toggle.closest(".dropdown");
        const wasOpen = dropdown.classList.contains("open");
        closeAllDropdowns();
        if(!wasOpen) 
            dropdown.classList.add("open");
    });
});

document.querySelectorAll('#difficulty-dropdown .dropdown-menu button').forEach(btn => {
    btn.addEventListener("click", () => {
        setDifficulty(btn.dataset.difficulty);
        closeAllDropdowns();
    });
});

document.querySelectorAll('#mode-dropdown .dropdown-menu button').forEach(btn => {
    btn.addEventListener("click", () => {
        setMode(btn.dataset.mode);
        closeAllDropdowns();
    });
});

document.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        if(!dropdown.contains(e.target)) 
            dropdown.classList.remove('open');
    });
});

startBtn.addEventListener("click", startTest);
restartBtn.addEventListener("click", restartTest);
document.getElementById("retry-btn").addEventListener("click", restartTest);
textDisplay.addEventListener("click", () => { if (!isTestRunning) startTest(); });

// PASSAGE HANDLING
async function pickPassage() {
  const res = await fetch(`${API_URL}/api/passages?difficulty=${difficulty}`);
  const json = await res.json();
  return json.text;
}

function renderPassage() {
    textDisplay.innerHTML = "";
    chars = [];
    passage.split("").forEach(char => {
        const charSpan = document.createElement("span");
        charSpan.textContent = char;
        textDisplay.appendChild(charSpan);
        chars.push({ el: charSpan, status: "pending" });
    });
    if(chars.length) 
        chars[0].el.classList.add("current");
}

async function showPreview() {
  passage = await pickPassage();
  renderPassage();
  textContainer.classList.remove("hidden");
  textDisplay.classList.add("blurred");
  wpmStat.textContent = 0;
  accuracyStat.textContent = "100%";
  timeStat.textContent = mode === "timed" ? formatTime(timeLimit) : "0:00";
}

// TEST LIFECYCLE
async function startTest() {
    clearInterval(timer);
    passage = await pickPassage();
    renderPassage();
    textContainer.classList.remove("hidden");
    textDisplay.classList.remove("blurred");
    document.getElementById("start-subtext").classList.add("hidden");
    startBtn.classList.add("hidden");
    restartBtn.classList.remove("hidden");
    resultContainer.classList.add("hidden");
    textInput.disabled = false;
    textInput.value = "";
    textInput.focus();
    elapsedTime = 0;
    correctChars = 0;
    incorrectChars = 0;
    lastLength = 0;
    isTestRunning = false;
    updateStats();
    textInput.focus();
}

function restartTest() {
    clearInterval(timer);
    startTest();
}

function endTest() {
    clearInterval(timer);
    textInput.disabled = true;
    textContainer.classList.add("hidden");
    restartBtn.classList.add("hidden");
    resultContainer.classList.remove("hidden");

    const total = correctChars + incorrectChars;
    const acc = total ? Math.round((correctChars / total) * 100) : 0;
    const minutes = mode === "timed" ? timeLimit / 60 : elapsedTime / 60 || 1 / 60;
    const wpm = Math.round((correctChars / 5) / minutes);

    document.getElementById("final-wpm").textContent = wpm;
    document.getElementById("final-accuracy").textContent = acc + "%";
    document.getElementById("char-count").innerHTML =
        `${correctChars}<span class="chars-sep">/</span><span class="chars-incorrect">${incorrectChars}</span>`;

    document.getElementById("result-title").textContent = "Test Complete!";
    document.getElementById("result-message").textContent = "Save your score to track your progress.";

    pendingScore = { wpm, accuracy: acc };
    document.getElementById("player-username").disabled = false;
    document.getElementById("player-password").disabled = false;
    document.getElementById("save-score-btn").disabled = false;
    document.getElementById("save-score-error").style.display = "none";
}

document.getElementById("save-score-btn").addEventListener("click", async () => {
    const usernameInput = document.getElementById("player-username");
    const passwordInput = document.getElementById("player-password");
    const errorEl = document.getElementById("save-score-error");
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password || !pendingScore) return;

    try {
        const res = await fetch(`${API_URL}/api/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, ...pendingScore, difficulty, mode })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || "Failed to save score";
            errorEl.style.display = "block";
            return;
        }

        localStorage.setItem("username", username);

        usernameInput.value = "";
        passwordInput.value = "";
        usernameInput.disabled = true;
        passwordInput.disabled = true;
        document.getElementById("save-score-btn").disabled = true;
        errorEl.style.display = "none";
        loadLeaderboard();
        loadPersonalBest();
    } catch (err) {
        console.error("Failed to save score:", err);
    }
});

async function loadLeaderboard() {
    try {
        const activeBtn = document.querySelector(".lb-filter-btn.active");
        const lbDifficulty = activeBtn ? activeBtn.dataset.lbDifficulty : "easy";
        const res = await fetch(`${API_URL}/api/scores/top?difficulty=${lbDifficulty}`);
        const scores = await res.json();
        const list = document.getElementById("leaderboard-list");
        if (!list) return;
        list.innerHTML = scores.length
            ? scores.map(s => `<li>${s.username} — <b>${s.wpm} WPM</b> (${s.accuracy}%)</li>`).join("")
            : "<li>No scores yet</li>";
    } catch (err) {
        console.error("Failed to load leaderboard:", err);
    }
}

document.querySelectorAll(".lb-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".lb-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadLeaderboard();
    });
});

// TYPING INPUT HANDLER
textInput.addEventListener("input", () => {
    const val = textInput.value;

    if(!isTestRunning) {
        isTestRunning = true;
        elapsedTime = mode === "timed" ? timeLimit : 0;
        startTimer();
    }

    if(val.length > lastLength) {
        const i = val.length - 1;
        if(i < chars.length) {
            if(chars[i].status === "pending") {
                const typedChar = val[i];
                const correct = typedChar === passage[i];
                chars[i].status = correct ? "correct" : "incorrect";
                chars[i].el.classList.add(correct ? "correct" : "incorrect");
                correct ? correctChars++ : incorrectChars++;
            } 
            else {
                chars[i].el.classList.add(chars[i].status);
            }
        }
    }
    else if(val.length < lastLength) {
        for(let i = val.length; i < lastLength; i++) {
            if(chars[i]) {
                if(chars[i].status === "correct") correctChars--;
                else if(chars[i].status === "incorrect") incorrectChars--;
                chars[i].status = "pending";
                chars[i].el.classList.remove("correct", "incorrect");
            }
        }
    }

    chars.forEach(c => c.el.classList.remove("current"));
    if(val.length < chars.length) 
        chars[val.length].el.classList.add("current");

    lastLength = val.length;
    updateStats();

    const passageCompleted = val.length >= passage.length;

    if(mode === "passage" && passageCompleted) {
        endTest();
    }
    else if(mode === "timed" && passageCompleted) {
        pickPassage().then(next => {
            passage += " " + next;
            const extra = (" " + next).split("");
            extra.forEach(char => {
                const charSpan = document.createElement("span");
                charSpan.textContent = char;
                textDisplay.appendChild(charSpan);
                chars.push({ el: charSpan, status: "pending" });
            });
        });
    }
});

// TIMER & STATS
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        if(mode === "timed") {
            elapsedTime--;
            if(elapsedTime <= 0) {
                elapsedTime = 0;
                updateStats();
                endTest();
                return;
            }
        }
        else 
            elapsedTime++;
        updateStats();
    }, 1000);
}

function formatTime(sec) {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function currentMinutes() {
    if(mode === "timed") 
        return (timeLimit - elapsedTime) / 60 || 1 / 60;
    return elapsedTime / 60 || 1 / 60;
}

function updateStats() {
    const total = correctChars + incorrectChars;
    const acc = total ? Math.round((correctChars / total) * 100) : 0;
    const wpm = Math.round((correctChars / 5) / Math.max(currentMinutes(), 1 / 60));
    wpmStat.textContent = wpm;
    accuracyStat.textContent = acc + "%";
    timeStat.textContent = formatTime(elapsedTime);
}

// CONFETTI (win animation)
function launchConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    const colors = ["#2f77ba", "#4ade80", "#F8DF75", "#BE4349", "#f3f4f6"];
    const particles = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height,
        r: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 3,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * 360,
        vr: -5 + Math.random() * 10
    }));

    let frames = 0;
    const maxFrames = 180;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rot * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
            ctx.restore();
        });
        frames++;
        if(frames < maxFrames) 
            requestAnimationFrame(animate);
        else 
            ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

showPreview();
loadLeaderboard();