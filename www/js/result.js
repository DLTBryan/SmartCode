// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./decode.html";
});

// Récupération de la sauvegarde de l'entrée utilisateur
if (window.localStorage.getItem("output") != null) {
    document.getElementById("output").innerHTML = window.localStorage.getItem("output").toString();
}

// Nombre de pixels (écrit en dur mais modulable)
var nbPixels = 32;
// Taille d'un pixel (écrit en dur mais modulable)
var sizePixel = 5;

// Récupération de l'entrée utilisateur
var data = JSON.parse(window.localStorage.getItem("data-output"));

// Récupération du canvas de la page HTML
var canvas = document.getElementById("canvas-result");

// Définition de la taille du canvas
canvas.width = nbPixels * sizePixel + 8;
canvas.height = canvas.width;

// Récupération du contexte du canvas
var context = canvas.getContext("2d");

// Création du fond blanc du QR Code
context.fillStyle = "white";
context.fillRect(0, 0, canvas.width, canvas.height);

// Affichage du QR Code
drawQRCode(context);

function drawQRCode(context) {
    // Affichage de chaque pixel en fonction de la valeur dans data
    for (i = 0; i < nbPixels; i++) {
        for (j = 0; j < nbPixels; j++) {
            drawPixel(context, i, j, data[i][j]);
        }
    }
    // Affichage des marges droites et en dessous
    for (i = 0; i < nbPixels; i++) {
        drawPixel(context, i, nbPixels, 0);
        drawPixel(context, nbPixels, i, 0);
    }
}

// Fonction pour afficher un pixel avec un rectangle dans le canvas
function drawPixel(context, ligne, colonne, couleur) {
    // Définition de la couleur
    if (couleur == 1) {
        context.fillStyle = "black";
    } else {
        context.fillStyle = "white";
    }
    // Récupération des coordonnées du pixel (+ 4 pour les marges)
    var x = colonne * sizePixel + 4;
    var y = ligne * sizePixel + 4;
    var x1 = colonne * sizePixel + sizePixel + 4;
    var y1 = ligne * sizePixel + sizePixel + 4;
    context.fillRect(x, y, x1, y1);
}