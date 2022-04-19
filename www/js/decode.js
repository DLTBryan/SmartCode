

document.getElementById("retour").addEventListener("click", () => {
    window.location.href = "./index.html";
});

document.getElementById("capture").addEventListener("click", () => {
  console.log("Click");
});

document.addEventListener("deviceready", () => {
    console.log(navigator.camera)
}, false);

let width = 320;
let height = 240;
let video = document.getElementById("video"); //video in html

let streaming = false;
let videoCap = null;
let stream = null;
let src = null;

let dstC1 = null;

let probableMiddles = new Array();

function initVideo(){
  if (streaming) return;
  navigator.mediaDevices.getUserMedia({ video: {
    facingMode: "environment"
    }, audio: false})
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
      video.setAttribute("width", width);
      video.setAttribute("height", height);
      streaming = true;
      videoCap = new cv.VideoCapture(video);
      
    }
    startVideoProcessing();
  }, false);
}
function startVideoProcessing(){
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  //stopVideoProcessing();
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  src = new cv.Mat(height, width, cv.CV_8UC4);
  requestAnimationFrame(processVideo);
}


function processVideo(){
  videoCap.read(src);
  let result = threshImage(src);
  cv.imshow("canvasOutput", result);
  requestAnimationFrame(processVideo);
}

function threshImage(src){
  let mat = new cv.Mat(height, width, cv.CV_8U);
  cv.cvtColor(src, mat, cv.COLOR_BGR2GRAY);
  cv.adaptiveThreshold(mat, dstC1, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 51, 0);
  mat.delete();
  return dstC1;
}


function captureCode(){
  console.log("Click");
}