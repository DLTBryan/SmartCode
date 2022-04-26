// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./index.html";
});

// Récupération de la sauvegarde de l'entrée utilisateur
document.getElementById("input").value = localStorage.getItem("input").toString();

// Gestion de la génération de QR Code
document.getElementById("form").addEventListener('submit', (event) => {
    event.preventDefault();
    // Définition de l'entrée utilisateur dans le localStorage
    localStorage.setItem("input", document.getElementById("input").value);
    window.location.href = "./generate.html";
});