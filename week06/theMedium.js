document.addEventListener("DOMContentLoaded", () => {
    console.log("theMessage");

    let theMain = document.querySelector('main')
    const images = ["wholeearth1.jpg", "wholeearth2.jpg", "wholeearth3.jpg", "wholeearth4.jpg", "wholeearth5.jpg"]
    let index = 0;

    const image = document.getElementById("i1");
    const next = document.getElementById("next");
    const prev = document.getElementById("prev");


    document.body.style.backgroundImage = `url(${images[index]})`;

    function update() {
        image.src = images[index];
        document.body.style.backgroundImage = `url(${images[index]})`;
    }

    next.addEventListener("click", () => {
    index = (index + 1) % images.length;
    update();
    });

    prev.addEventListener("click", () => {
    index = (index - 1 + images.length) % images.length;
    update();
    });
});