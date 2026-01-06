let selectedCandidateID = null;
let isAdminLoggedIn = false;
let barChart = null;
let pieChart = null;
let audioCtx = null;

/* Beep sound */
function playBeep() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const osc = audioCtx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 900;
    osc.connect(audioCtx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 120);
}

/* Select Candidate */
function selectCandidate(id, el) {
    selectedCandidateID = id;
    playBeep();

    document.getElementById("selectedCandidate").innerText =
        "Selected Candidate ID: " + id;

    document.querySelectorAll(".poll-row")
        .forEach(r => r.classList.remove("active"));

    el.classList.add("active");
}

/* Cast Vote (NO BEEP HERE) */
function castVote() {
    let voterID = document.getElementById("voterID").value;

    if (!voterID || !selectedCandidateID) {
        alert("Enter Voter ID & select candidate");
        return;
    }

    fetch("/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterID, candidateID: selectedCandidateID })
    })
    .then(res => res.json())
    .then(data => alert(data.message));
}

/* Admin Login */
function adminLogin() {
    fetch("/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: adminUser.value,
            password: adminPass.value
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            isAdminLoggedIn = true;
            adminPanel.style.display = "block";
            getResults();
        } else alert("Invalid login");
    });
}

/* Logout */
function adminLogout() {
    isAdminLoggedIn = false;
    adminPanel.style.display = "none";
    if (barChart) barChart.destroy();
    if (pieChart) pieChart.destroy();
}

/* Results + Charts */
function getResults() {
    fetch("/results")
    .then(res => res.json())
    .then(data => {
        let labels = [], votes = [], perc = [];
        output.innerHTML = "";

        for (let c in data.result) {
            labels.push(c);
            votes.push(data.result[c].votes);
            perc.push(data.result[c].percentage);
            output.innerHTML += `${c}: ${data.result[c].votes} votes<br>`;
        }

        winner.innerHTML = data.maxVotes > 0
            ? `🏆 Winner: ${data.winner}`
            : "Voting in progress";

        if (barChart) barChart.destroy();
        if (pieChart) pieChart.destroy();

        barChart = new Chart(barChartCanvas, {
            type: "bar",
            data: { labels, datasets: [{ data: votes }] }
        });

        pieChart = new Chart(pieChartCanvas, {
            type: "pie",
            data: { labels, datasets: [{ data: perc }] }
        });
    });
}

setInterval(() => {
    if (isAdminLoggedIn) getResults();
}, 3000);
