document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./index.html";
});

document.addEventListener("deviceready", () => {
    console.log(navigator.camera)
}, false);

let widht = 320;
let height = 240;
let video = null;
let streaming = false;
let videoCap = null;


function initVideo(){
    video = document.getElementById("video");
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(s) {
    stream = s;
    video.srcObject = s;
    video.play();
  })
    .catch(function(err) {
    console.log("An error occured! " + err);
  });

  video.addEventListener("canplay", function(ev){
    if (!streaming) {
      //height = video.videoHeight / (video.videoWidth/width);
      video.setAttribute("width", widht);
      video.setAttribute("height", height);
      streaming = true;
      videoCap = new cv.VideoCapture(video);
    }
    startVideoProcessing();
  }, false);
}
function initOpenCV(){
    initVideo();
}