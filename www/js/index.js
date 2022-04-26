// Event de Cordova permettant de lancer l'application quand le téléphone est prêt
document.addEventListener("deviceready", () => {
    screen.orientation.lock("portrait");
}, false);

// Gestion du bouton encode
document.getElementById("encode").addEventListener("click", () => {
    window.location.href = "./encode.html";
});

// Gestion du bouton decode
document.getElementById("decode").addEventListener("click", () => {
    window.location.href = "./decode.html";
});