// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./decode.html";
});

// Récupération de la sauvegarde de l'entrée utilisateur
if (window.localStorage.getItem("output") != null) {
    document.getElementById("output").innerHTML = window.localStorage.getItem("output").toString();
}