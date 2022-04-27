// Gestion du bouton de retour
document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./encode.html";
});

// Nombre de pixels (écrit en dur mais modulable)
var nbPixels = 32;
// Taille d'un pixel (écrit en dur mais modulable)
var sizePixel = 5;

// Caractère ASCII de fin de mot
let EXT = [0, 0, 0, 0, 0, 0, 1, 1];
// Fonction pour comparer 2 arrays (utilisé pour détecter la fin du texte)
const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Initialisation du tableau de données binaires
var data = new Array(nbPixels);
for(i = 0; i < nbPixels; i++) {
    data[i] = new Array(nbPixels);
}

// Remplissage du QR Code avec de la donnée aléatoire
var start = 0;
var cursor = 0;
for(i = 0; i < nbPixels; i++) {
    for(j = 0; j < nbPixels; j++) {
        // Si on est pas dans le timing pattern
        if(i != 6 && j != 6) {
            data[i][j] = Math.floor(Math.random() * Math.floor(2));;
        } else {
            data[i][j] = + (cursor % 2 == 0);
            cursor++;
        }
    }
    start = !start;
    cursor = start;
}

generateQRCode();

// Fonction pour générer le QR Code
function generateQRCode() {
    // Récupération de l'entrée utilisateur
    var input = localStorage.getItem("input");

    // Récupération du canvas de la page HTML
    var canvas = document.getElementById("canvas");

    // Définition de la taille du canvas
    canvas.width = nbPixels * sizePixel + 8;
    canvas.height = canvas.width;

    // Récupération du contexte du canvas
    var context = canvas.getContext("2d");

    // Création du fond blanc du QR Code
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Création des 3 marqueurs de positionnement
    createMarqueur(0, 0);
    createMarqueur(nbPixels - 7, 0);
    createMarqueur(0, nbPixels - 7);

    // Ajout du type du QR Code (2 caractères maximum)
    addType("SD");

    // Encodage du QR Code avec l'entrée utilisateur
    encode(input);

    // On applique le masque 2 fois pour tester
    mask();
    mask();

    // Affichage du QR Code
    drawQRCode(context);

    // Fonction pour décoder le QR Code (à utiliser dans decode.html);
    let result = decode();
    console.log(result);
}

function createMarqueur(ligne, colonne) {
    // Création des marges pour les marqueurs de position
    for(i = -1; i < 8; i++) {
        for(j = -1; j < 8; j++) {
            if(ligne + i < nbPixels && ligne + i >= 0 && colonne + j < nbPixels && colonne + j >= 0) {
                data[ligne + i][colonne + j] = 0;
            }
        }
    }
    // Première rangée du marqueur
    for(i = 0; i < 7; i++) {
        data[ligne][colonne + i] = 1;
    }
    // Deuxième rangée du marqueur
    ligne++;
    data[ligne][colonne] = 1;
    data[ligne][colonne + 6] = 1;
    // Troisième / quatrième et cinquième rangée du marqueur
    for(i = 0; i < 3; i++) {
        ligne++;
        data[ligne][colonne] = 1;
        data[ligne][colonne + 2] = 1;
        data[ligne][colonne + 3] = 1;
        data[ligne][colonne + 4] = 1;
        data[ligne][colonne + 6] = 1;
    }
    // Sixième rangée du marqueur
    ligne++;
    data[ligne][colonne] = 1;
    data[ligne][colonne + 6] = 1;
    // Dernière rangée du marqueur
    ligne++;
    for(i = 0; i < 7; i++) {
        data[ligne][colonne + i] = 1;
    }
}

// Ajout du type codé sur 2 caractères
function addType(identificateur) {
    let binary = ASCIItoBinary(identificateur);
    if(binary.length != 16) {
        console.log("Erreur, type incorrect (2 caractères maximum)");
        return;
    }
    for(i = 0; i < binary.length; i++) {
        data[0][i + 8] = binary[i];
    }
}

function ASCIItoBinary(input) {
    let result = new Array(input.length * 8);
    // Curseur pour connaître la position dans l'array
    let cursor = 0;
    // Pour chaque caractère
    for(i = 0; i < input.length; i++) {
        let binary = input[i].charCodeAt(0).toString(2);
        // Ajout des 0 avant le binaire pour avoir une taille de 8
        let tmp = "";
        let length = binary.length;
        while(length < 8) {
            tmp += "0";
            length++;
        }
        binary = tmp + binary;
        // Ajout dans le résultat
        for(j = 0; j < 8; j++) {
            result[cursor] = parseInt(binary[j]);
            cursor++;
        }
    }
    return result;
}

function drawQRCode(context) {
    // Affichage de chaque pixel en fonction de la valeur dans data
    for(i = 0; i < nbPixels; i++) {
        for(j = 0; j < nbPixels; j++) {
            drawPixel(context, i, j, data[i][j]);
        }
    }
    // Affichage des marges droites et en dessous
    for(i = 0; i < nbPixels; i++) {
        drawPixel(context, i, nbPixels, 0);
        drawPixel(context, nbPixels, i, 0);
    }
}

// Fonction pour afficher un pixel avec un rectangle dans le canvas
function drawPixel(context, ligne, colonne, couleur) {
    // Définition de la couleur
    if(couleur == 1) {
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

function encode(input) {
    // Récupération de l'entrée en binaire
    let binary = ASCIItoBinary(input);
    // Curseur pour le mot à entrer
    let cursor = 0;
    // Curseur pour le caractère EXT
    let EXTCursor = 0;
    for(j = nbPixels - 1; j > 7; j--) {
        for(i = nbPixels - 1; i > 7; i--) {
            // Si le curseur n'est pas arrivé à la fin du mot
            if(binary.length > cursor) {
                data[i][j] = + binary[cursor];
            } else {
                // Si le curseur n'est pas arrivé à la fin du mot + le caractère EXT
                if(binary.length + 8 > cursor) {
                    // On ajoute le caractère EXT
                    data[i][j] = + EXT[EXTCursor];
                    EXTCursor++;
                } else {
                    break;
                }
            }
            cursor++;
        }
    }
}

// Décodage du QR Code
function decode() {
    // Le tableau de mots binaires
    let binary = new Array();
    // La lettre en binaire
    let letter = new Array(8);
    // Curseur pour parcourir les données
    let cursor = 0;
    // Curseur pour parcourir la lettre
    let letterCursor = 0;
    for(j = nbPixels - 1; j > 7; j--) {
        for(i = nbPixels - 1; i > 7; i--) {
            // Création de la lettre codée sous 8 bits
            if(letterCursor <= 7) {
                letter[letterCursor] = data[i][j];
                letterCursor++;
            } else {
                // Si la lettre est le caractère EXT, on arrête de décoder
                if(equals(letter, EXT)) {
                    break;
                }
                // Sinon on ajoute la lettre dans le tableau de données et on reset les curseurs
                binary[cursor] = letter;
                letterCursor = 0;
                letter = new Array(8);
                letter[0] = data[i][j];
                letterCursor++;
                cursor++;
            }
        }
    }
    // Conversion du tableau binaire en caractères ASCII
    let result = "";
    for(i = 0; i < binary.length; i++) {
        result += String.fromCharCode(parseInt(binary[i].join(''), 2));
    }
    return result;
}

// Applique le masque sur tout le QR Code sauf le timing pattern et les marqueurs de position
function mask() {
    // Applique le masque sur la marge haute 
    for(i = 0; i < 8; i++) {
        for(j = 8; j < nbPixels - 8; j++) {
            if(i != 6) {
                if((i + j) % 2 == 0) {
                    data[i][j] = + !data[i][j];
                }
            }
        }
    }
    // Aplique le masque sr la marge gauche
    for(i = 8; i < nbPixels - 8; i++) {
        for(j = 0; j < 8; j++) {
            if(j != 6) {
                if((i + j) % 2 == 0) {
                    data[i][j] = + !data[i][j];
                }
            }
        }
    }
    // Applique le masque sur le contenu du QR Code
    for(i = 0; i < nbPixels; i++) {
        for(j = 0; j < nbPixels; j++) {
            if(i > 7 && j > 7) {
                if((i + j) % 2 == 0) {
                    data[i][j] = + !data[i][j];
                }
            }
        }
    }
}