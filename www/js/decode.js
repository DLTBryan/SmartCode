

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

//mats for qr detection
let src = null;
let gryMat = null;
let blurredGaussMat = null;
let edgedMat = null;
let contourMat = null;
let hierarchie = null;

let dstC1 = null;dstC1

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
      height = video.videoHeight / (video.videoWidth/width);
       video.setAttribute("width", width);
       video.setAttribute("height", height);
      streaming = true;
      
      videoCap = new cv.VideoCapture(video);

      //video.height = video.videoHeight;
      //video.width = video.videoWidth;
      //width = video.videoWidth; height = video.videoHeight;
      
    }
    startVideoProcessing();
  }, false);
}
function startVideoProcessing(){
  if (!streaming) { console.warn("Please startup your webcam"); return; }
  dstC1 = new cv.Mat(height, width, cv.CV_8UC1);
  src = new cv.Mat(height, width, cv.CV_8UC4);
  requestAnimationFrame(processVideo);
}


function processVideo(){
  videoCap.read(src);
  let result = findQRCode(src);
  cv.imshow("canvasOutput", result);

  requestAnimationFrame(processVideo);
}



function findTimingPattern(src){

}

/**
 * First step of the QR detection.
 * @param {cv.Mat} src
 * @return {cv.Mat}
 * 
 * Firstly we need to have a greyed Image to input this one in a 
 * Gaussian Blur to remove as mush Gaussian noise that we can.
 * 
 * Applying a Canny function to find the edges of the smoothen 
 * image. As this image will be used inside a coutour finder Opencv's fucntion.
 *   
 * 
 * 
 */
function findQRCode(src){

  initializeMats();

  cv.cvtColor(src, gryMat, cv.COLOR_RGB2GRAY, 0);
  cv.GaussianBlur(gryMat, blurredGaussMat, new cv.Size(5,5), 0);

  
  cv.Canny(blurredGaussMat, edgedMat, 100,200);

  cv.findContours(edgedMat, contourMat, hierarchie, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
  let positionMarkers = findPositionMarkers(ApproxPositionMarkers());
  
  deleteMats();

  return src;
}

function findPositionMarkers(approx){
  let box  = [];
  for (let i = 0; i < approx.length; ++i) {
      let cnt = contourMat.get(approx[i]);
      let rotatedRect = cv.minAreaRect(cnt);
      let ratio = rotatedRect.size.width / rotatedRect.size.height
      if(ratio < 1.4 && ratio > 0.7) {
          let vertices = cv.RotatedRect.points(rotatedRect);
          box.push(vertices);
          for (let j = 0; j < 4; j++)
            cv.line(src, vertices[j], vertices[(j + 1) % 4], [0, 255, 0, 255], 1, cv.LINE_AA, 0);
      }
      cnt.delete();
  }
  return box;
}

function ApproxPositionMarkers(){
  let j = 0;
  let count = 0;
  let markers = new Array();

  for(var i = 0; i < contourMat.size(); i++){
    j = i;
    count = 0;
    while(hierarchie.intPtr(0,j)[2] != -1){
      j = hierarchie.intPtr(0,j)[2];
      count++;
    }
    
    if(count >= 5){
      markers.push(i);
    }
  }
  return markers;
}

function initializeMats(){
  gryMat = new cv.Mat(); //greyed image
  blurredGaussMat = new cv.Mat(); //blurred image
  edgedMat = new cv.Mat(); //edged image
  contourMat = new cv.MatVector(); //contour image
  hierarchie = new cv.Mat(); //output vector
}

function deleteMats(){
  gryMat.delete();
  blurredGaussMat.delete();
  edgedMat.delete();
  contourMat.delete();
  hierarchie.delete();
}

function getDistanceBetweenPoints(p1, p2){
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}


function captureCode(){
  console.log("Click");
}

function initOpenCV(){
  initVideo();
}


// function threshImage(src){
//   let mat = new cv.Mat(height, width, cv.CV_8U);
//   cv.cvtColor(src, mat, cv.COLOR_BGR2GRAY);
//   cv.adaptiveThreshold(mat, dstC1, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 51, 0);
//   mat.delete();
//   return dstC1;
// }