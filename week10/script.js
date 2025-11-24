
const comments = [
    "i saw a clip of charlie kirk today, don’t really know much about him tbh",
    "some of the stuff he says sounds reasonable, some of it feels kinda dramatic",
    "people act like he’s the worst person alive or the smartest dude ever, no middle ground lol",
    "ok but did anyone here actually watch the full context, not just a 10 second clip",
    "the guy makes good points sometimes, but other times he’s clearly pushing a narrative",
    "bro he literally says things just to get a reaction and it works every time",
    "why do his supporters act like questioning him is forbidden, chill out",
    "nah because the people who hate him also twist his words for clout, it goes both ways",
    "He was a martyr for MAGA and nationalism. It was abhorrent what happened",
    "some of you MAGA ****** act like he’s singlehandedly saving america, relax",
    "and some of you liberal ******* act like he’s the source of all evil, touch grass",
    "'Counting or not counting gun violence'",
    "Anyone against his values needs to KYS",
    "^ this guy's address is 370 Jay St, Brooklyn, NY lets go jump him"
  ];
  

let count = 0;
let postNumber = 100000;

const feed = document.getElementById("feed");
const btn = document.getElementById("btn");

btn.addEventListener("click", () => {
    if (count >= comments.length) return;

    const text = comments[count];
    postNumber++;



    const div = document.createElement("div");
    div.className = "comment";

    div.innerHTML = `
        <div class="post-header">
            <span class="name">Anonymous</span>
            <span class="post-no">No.${postNumber}</span>
        </div>
        <div class="post-text">${text}</div>
    `;

    feed.appendChild(div);

    count++;
    updateBackground();
});


function updateBackground() {
    const progress = Math.min(count / comments.length, 1);

    const r = Math.round(255 * progress);
    const g = Math.round(255 * (1 - progress));

    document.body.style.background = `rgb(${r}, ${g}, 0)`;
}


