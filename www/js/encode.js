document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./index.html";
});

document.getElementById("form").addEventListener('submit', (event) => {
    event.preventDefault();
    console.log(event);
});