// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./encode.html";
});

// Nombre de pixels (écrit en dur mais modulable)
var nbPixels = 32;
// Taille d'un pixel (écrit en dur mais modulable)
var sizePixel = 5;

// Initialisation du tableau de données binaires
var data = new Array(nbPixels).fill(0);
for(i = 0; i < nbPixels; i++) {
    data[i] = new Array(nbPixels).fill(0);
}

generateQRCode();

// Fonction pour générer le QR Code
function generateQRCode() {
    // Récupération de l'entrée utilisateur
    var input = localStorage.getItem("input");

    // Récupération du canvas de la page HTML
    var canvas = document.getElementById("canvas");

    // Définition de la taille du canvas
    canvas.width = nbPixels * sizePixel + 4 * sizePixel;
    canvas.height = canvas.width;

    // Récupération du contexte du canvas
    var context = canvas.getContext("2d");

    // Création du fond blanc du QR Code
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Création des 3 marqueurs de positionnement
    createMarqueur(0, 0);
    createMarqueur(nbPixels - 5, 0);
    createMarqueur(0, nbPixels - 5);
    console.log(data);
}

function createMarqueur(ligne, colonne) {
    // Première rangée du marqueur
    for(i = 0; i < 5; i++) {
        data[ligne][colonne + i] = 1;
    }
    // Deuxième rangée du marqueur
    ligne++;
    data[ligne][colonne] = 1;
    data[ligne][colonne + 4] = 1;
    // Troisième rangée du marqueur
    ligne++;
    data[ligne][colonne] = 1;
    data[ligne][colonne + 2] = 1;
    data[ligne][colonne + 4] = 1;
    // Quatrième rangée du marqueur
    ligne++;
    data[ligne][colonne] = 1;
    data[ligne][colonne + 4] = 1;
    // Dernière rangée du marqueur
    ligne++;
    for(i = 0; i < 5; i++) {
        data[ligne][colonne + i] = 1;
    }
}