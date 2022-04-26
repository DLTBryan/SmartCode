// Event de Cordova permettant de lancer l'application quand le téléphone est prêt
document.addEventListener("deviceready", () => {
    screen.orientation.lock("portrait");
    let permissions = cordova.plugins.permissions

    permissions.requestPermission(permissions.CAMERA, success, error);

}, false);

document.getElementById("encode").addEventListener("click", () => {
    window.location.href = "./encode.html";
});

document.getElementById("decode").addEventListener("click", () => {
    window.location.href = "./decode.html";
});



function error() {
    console.warn('Camera permission is not turned on');
}
  
function success( status ) {
    if( !status.hasPermission ) error();
}