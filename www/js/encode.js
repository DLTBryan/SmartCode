// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./index.html";
});

// Récupération de la sauvegarde de l'entrée utilisateur
if (window.localStorage.getItem("input") != null) {
    document.getElementById("input").value = window.localStorage.getItem("input").toString();
    document.getElementById("nb-char").innerHTML = document.getElementById("input").value.length;
}

document.getElementById("input").addEventListener("input", () => {
    document.getElementById("nb-char").innerHTML = document.getElementById("input").value.length;
})

// Gestion de la génération de QR Code
document.getElementById("generate").addEventListener("click", () => {
    // Définition de l'entrée utilisateur dans le localStorage
    window.localStorage.setItem("input", document.getElementById("input").value);
    window.location.href = "./generate.html";
});