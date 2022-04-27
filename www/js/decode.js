// Gestion du bouton de retour
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
let thresholdedImage = null;

let dstC1 = null;

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
  cv.imshow("canvasOutput", findQRCode(src));

  requestAnimationFrame(processVideo);
}



function findTimingPattern(src){

}

/**
 * First step of the QR detection.
 * @param {cv.Mat} src
 * @return {cv.Mat}
 * 
 * Firstly we need to have verticeA greyed Image to input this one in verticeA 
 * Gaussian Blur to remove as mush Gaussian noise that we can.
 * 
 * Applying verticeA Canny function to find the edges of the smoothen 
 * image. As this image will be used inside verticeA coutour finder Opencv's fucntion.
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
  
  let qrPoint  = [];
  cv.threshold(gryMat, thresholdedImage, 100, 255, cv.THRESH_BINARY);

  for (let i = 0; i < positionMarkers.length; ++i){
    for (let j = i + 1; j < positionMarkers.length; ++j){
      if (isQrCode(positionMarkers[i], positionMarkers[j])){
        for (let m = 0; m < 4; ++m) {
          qrPoint.push(positionMarkers[i][m]);
          qrPoint.push(positionMarkers[j][m]);
        }
      }
    }
  }

  if (qrPoint.length > 12) {
    let qrMat = new cv.Mat(qrPoint.length, 1, cv.CV_32SC2);
    for (let i = 0; i < qrPoint.length; ++i) {
        qrMat.intPtr(i, 0)[0] =  qrPoint[i].x;
        qrMat.intPtr(i, 0)[1] =  qrPoint[i].y;
    }

    let qrRec = cv.minAreaRect(qrMat);
    let qrWidth = qrRec.size.width;
    let qrHeight = qrRec.size.height;
    let qrVertices = cv.RotatedRect.points(qrRec);
    for (let i = 0; i < 4; ++i)
      cv.line(src, qrVertices[i], qrVertices[(i+1) % 4], [255, 0, 255, 255], 2);

    let length = (qrWidth + qrHeight) / 2;
    let qrx = qrRec.center.x - length / 2;
    let qry = qrRec.center.y - length / 2;

    // if (0 < qrx && qrx + length < src.cols && 0 < qry && qry + length < src.rows) {
    //     let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [qrVertices[0].x, qrVertices[0].y, qrVertices[1].x,
    //                                                      qrVertices[1].y, qrVertices[2].x, qrVertices[2].y,
    //                                                      qrVertices[3].x, qrVertices[3].y]);
    //     let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [qrx, qry, qrx + length, qry, qrx + length,
    //                                                      qry + length, qrx, qry + length]);
    //     let M = cv.getPerspectiveTransform(srcTri, dstTri);
    //     cv.warpPerspective(src, src, M, src.size());
    //     M.delete(); srcTri.delete(); dstTri.delete();
    //     let qrRoi = src.roi(new cv.Rect(qrx, qry, length, length));
    //     cv.imshow("canvasOutput", qrRoi);
    //     load();
    //     qrRoi.delete();
    // }
    qrMat.delete();
  }

  //drawTiming(qrPoint);
  
    
  
  deleteMats();

  return src;
}
function isQrCode(verticeA, verticeB) {
  let distanceMinA = Number.MAX_VALUE;
  let distanceMinB = Number.MAX_VALUE;
  let pointA  = new Array(2);
  let pointB  = new Array(2);
  // Find the nearest two sets of verticeA-verticeB vertices
  for (let i = 0; i < verticeA.length; ++i){
    for (let j = 0; j < verticeB.length; ++j) {
      let distance = getDistanceBetweenPoints(verticeA[i], verticeB[j]);
      if (distance < distanceMinA) {

        distanceMinB = distanceMinA;
        distanceMinA = distance;

        pointB[0] = pointA[0];
        pointB[1] = pointA[1];

        pointA[0] = verticeA[i];
        pointA[1] = verticeB[j];
      } else if (distance < distanceMinB) {

        distanceMinB = distance;

        pointB[0] = verticeA[i];
        pointB[1] = verticeB[j];
      }
    }
  }
  let points = generateNewPoints(pointA, pointB);

  //drawLinesPattern(points);

  return (correctTimingPattern(points[0], points[1]) || correctTimingPattern(points[2], points[3]));
}

function generateNewPoints(arrayA, arrayB){
  let pointsArray = new Array(4);

  pointsArray[0] = new cv.Point(calculateNewCoord(arrayA[0], arrayB[0], false), calculateNewCoord(arrayA[0], arrayB[0], true));
  pointsArray[1] = new cv.Point(calculateNewCoord(arrayA[1], arrayB[1], false), calculateNewCoord(arrayA[1], arrayB[1], true));
  pointsArray[2] = new cv.Point(calculateNewCoord(arrayB[0], arrayA[0], false), calculateNewCoord(arrayB[0], arrayA[0], true));
  pointsArray[3] = new cv.Point(calculateNewCoord(arrayB[1], arrayA[1], false), calculateNewCoord(arrayB[1], arrayA[1], true));

  return pointsArray;
}

function calculateNewCoord(t1, t2, isY){
  if(isY){
    return t1.y + (t2.y - t1.y) / 14;
  }else{
    return t1.x + (t2.x - t1.x) / 14;
  }
}


function correctTimingPattern(Pa,Pb){
  if (Math.abs((Pa.y - Pb.y) / (Pa.x - Pb.x)) < 1.3 && Math.abs((Pa.y - Pb.y) / (Pa.x - Pb.x)) > 0.76)
    return false

  let linePix = [];
  let lenx = Math.abs(Pa.x - Pb.x) +1;
  let leny = Math.abs(Pa.y - Pb.y) +1;
  let len = lenx > leny ? lenx : leny;
  let x = 0;
  let y = 0;
  for (let i = 0; i < len; ++i) {
    x = Pa.x + Math.round((Pb.x - Pa.x) / (len - 1) * i);
    y = Pa.y + Math.round((Pb.y - Pa.y) / (len - 1) * i);
    let pix = thresholdedImage.ucharPtr(y, x)[0];
    linePix.push(pix);
  }

  if (linePix.length < 10)
    return false;

  // Remove head and tail pixels
  let tmp = linePix[0];
  let lineLen = linePix.length
  for (let i = 0; i < lineLen; ++i) {
    if (linePix[i] !== tmp) {
        linePix.splice(0, i);
        break;
    }
    if (i === lineLen-1)
        return false;
  }

  tmp = linePix[linePix.length-1];
  lineLen = linePix.length;
  for (let i = 0; i < lineLen; ++i) {
    if (linePix[lineLen - i] !== tmp) {
        linePix.splice(lineLen - i + 1, i);
        break;
    }
  }

  if (linePix.length < 10)
    return false;

  // Count the number of same pixels
  let countArray = [];
  let count = 1;
  tmp = linePix[0];
  for (let i = 0; i < lineLen; ++i) {
    if (linePix[i] == tmp)
        ++count;
    else {
        countArray.push(count);
        count = 1;
        tmp = linePix[i];
    }
  }
  countArray.push(count);
  if (countArray.length < 5) {
    return false;
}

// Get variance
let varMin = 5;
let sum = 0;
let mean = 0;
let variance = 0;
for (let i = 0; i < countArray.length; ++i)
  sum += countArray[i];
mean = sum / countArray.length;
for (let i = 0; i < countArray.length; ++i)
  variance += Math.pow((countArray[i] - mean), 2);
variance = Math.sqrt(variance);
return variance < varMin;
}


function findPositionMarkers(approx){
  let superPixels  = [];
  for (let i = 0; i < approx.length; ++i) {
      let rotatedRect = cv.minAreaRect(contourMat.get(approx[i]));
      let ratio = rotatedRect.size.width / rotatedRect.size.height
      if(isCorrectSquare(ratio)) {
        let vertices = cv.RotatedRect.points(rotatedRect);
        superPixels.push(vertices);
        //drawPositionMarkers(vertices);
      }
  }
  return superPixels;
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
  thresholdedImage = new cv.Mat(); //threshed Image 
}

function deleteMats(){
  gryMat.delete();
  blurredGaussMat.delete();
  edgedMat.delete();
  contourMat.delete();
  hierarchie.delete();
  thresholdedImage.delete();
}

function getDistanceBetweenPoints(p1, p2){
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function isCorrectSquare(ratio){
  return ratio > 0.75 && ratio < 1.45;
}

//drawing methods 
function drawPositionMarkers(vertices){
  for (let j = 0; j < 4; j++)
    cv.line(src, vertices[j], vertices[(j + 1) % 4], [0, 255, 0, 255], 1, cv.LINE_AA, 0);
}

function drawLinesPattern(points){
  cv.line(src, points[2], points[3], [255, 0, 0, 255]);
  cv.line(src, points[0], points[1], [0, 255, 0, 255]);
}

function drawTiming(points){
  for (let i = 0; i < points.length; ++i){
    cv.line(src, points[i], points[(i+1) % points.length], [0, 0, 255, 255], 2);
  }
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