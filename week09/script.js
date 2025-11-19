const buttons = document.querySelectorAll(".buttons button");
const feedback = document.getElementById("feedback");
const statsList = document.getElementById("statsList");
const topChoice = document.getElementById("topChoice");

const counts = {
    Animals: 0,
    Sports: 0,
    Drama: 0
};

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const topic = button.dataset.topic;
        counts[topic] += 1;

        feedback.textContent =
            "Your feed will now show more: " + topic;

        updateStats();
        updateTopChoice();
    });
});

function updateStats() {
    statsList.innerHTML = `
        <li>Animals: ${counts.Animals}</li>
        <li>Sports: ${counts.Sports}</li>
        <li>Drama: ${counts.Drama}</li>
    `;
}

function updateTopChoice() {
    const total =
        counts.Animals + counts.Sports + counts.Drama;

    if (total === 0) {
        topChoice.textContent = "No clear favorite yet.";
        return;
    }

    let favorite = "Animals";
    if (counts.Sports > counts[favorite]) favorite = "Sports";
    if (counts.Drama > counts[favorite]) favorite = "Drama";

    const percent = Math.round((counts[favorite] / total) * 100);

    topChoice.textContent =
        "The feed thinks you care most about: " +
        favorite +
        " (" + percent + "% of your clicks)";
}
