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

let verticesSuperPixels = null;

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


function getAlignmentCoordinates(version) {
  if (version === 1) {
    return [];
  }
  const intervals = Math.floor(version / 7) + 1;
  const distance = 4 * version + 4; // between first and last alignment pattern
  const step = Math.ceil(distance / intervals / 2) * 2; // To get the next even number
  return [6].concat(Array.from(
    { length: intervals },
    (_, index) => distance + 6 - (intervals - 1 - index) * step)
  );
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

  if (qrPoint.length > 12) { //test if 12points 
    let qrMat = new cv.Mat(qrPoint.length, 1, cv.CV_32SC2);
    for (let i = 0; i < qrPoint.length; ++i) {
        qrMat.intPtr(i, 0)[0] =  qrPoint[i].x;
        qrMat.intPtr(i, 0)[1] =  qrPoint[i].y;
    }

    let qrRec = cv.minAreaRect(qrMat);
    let qrWidth = qrRec.size.width;
    let qrHeight = qrRec.size.height;
    let qrVertices = cv.RotatedRect.points(qrRec);

    //drawMarker(qrVertices);

    let length = (qrWidth + qrHeight) / 2;
    let qrx = qrRec.center.x - length / 2;
    let qry = qrRec.center.y - length / 2;

    //point 0,0 le plus en haut à gauche 
    if (0 < qrx && qrx + length < src.cols && 0 < qry && qry + length < src.rows) {
      
      let nbRotation = transformDetection(qrVertices, qrRec.center, qrPoint);
      console.log("nbRotation => %c%d",'color: white; background-color: orange; padding: 2px 5px; border-radius: 2px', nbRotation);
      //en haut à gauche , en haut à droite, en bas à droite, en bas à gauche 
      let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [qrVertices[0].x, qrVertices[0].y, qrVertices[1].x,
                                                         qrVertices[1].y, qrVertices[2].x, qrVertices[2].y,
                                                         qrVertices[3].x, qrVertices[3].y]);

      let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [qrx, qry, qrx + length, qry, qrx + length,
                                                         qry + length, qrx, qry + length]);
      
      let clone = src.clone();
      let M = cv.getPerspectiveTransform(srcTri, dstTri);
        
      cv.warpPerspective(clone, clone, M, clone.size());
      M.delete(); srcTri.delete(); dstTri.delete();
      let qrRoi = clone.roi(new cv.Rect(qrx, qry, length, length));

      let array = extractInformation(qrRoi);
      //cv.imshow("canvasResult", qrRoi);
      cv.imshow("canvasResult", thresholdedImage);
      console.log(array);
      qrRoi.delete();
      clone.delete();
    }
    qrMat.delete();
  }

  //drawTiming(qrPoint);
  
    
  
  deleteMats();

  return src;
}

function extractInformation(qrRoi){
  let bits = new Array();

  cv.cvtColor(qrRoi, gryMat, cv.COLOR_RGB2GRAY, 0);
  cv.threshold(gryMat, thresholdedImage, 100, 255, cv.THRESH_BINARY);


  for(let i = 0; i < thresholdedImage.cols; ++i){
    let tmp = new Array();
    for(let j = 0; j < thresholdedImage.rows; ++j){
      let p = thresholdedImage.ucharPtr(i, j)[0];
      if(p === 255){
        tmp.push(0);
      }else{
        tmp.push(1);
      }
    }
    bits.push(tmp);
  }

  console.log(bits.length);
  return bits;

}

function transformDetection(array, center, qrPoints){
  let transformed = new Array(4);

  let transformedCoords = new Array(4);
  transformed[0] = false; transformed[1] = false; transformed[2] = true; transformed[3] = false;
  
  for (let i = 0; i < array.length; ++i) {
    if(array[i].x - center.x < 0 && array[i].y - center.y < 0){ //Top Left
      transformedCoords[0] = array[i];
    }else if(array[i].x - center.x < 0 && array[i].y - center.y >= 0){ // Top Right
      transformedCoords[1] = array[i];
    }else if(array[i].x - center.x >=0 && array[i].y - center.y >= 0){ // Bottom Left
      transformedCoords[2] = array[i];
    }else if(array[i].x - center.x >= 0 && array[i].y - center.y < 0){ // Bottom Right
      transformedCoords[3] = array[i];
    }
  }

  // cv.circle(src, transformedCoords[0], 5, [255, 0, 0, 255], 2);
  // cv.circle(src, transformedCoords[1], 5, [0, 255, 0, 255], 2);
  // cv.circle(src, transformedCoords[2], 5, [0, 0, 255, 255], 2);
  // cv.circle(src, transformedCoords[3], 5, [255, 255, 255, 255], 2);


  // cv.circle(src, array[0], 5, [255, 0, 0, 255], 2);
  // cv.circle(src, array[1], 5, [0, 255, 0, 255], 2);
  // cv.circle(src, array[2], 5, [0, 0, 255, 255], 2);
  // cv.circle(src, array[3], 5, [255, 255, 255, 255], 2);

  // console.log(transformedCoords);

  // console.log(array);

    for(let i = 0; i < qrPoints.length; i+=4){
      //Top Left
        transformed[0] = (qrPoints[i].x - center.x < 0 && qrPoints[i+0].y - center.y < 0)
          && (qrPoints[i+1].x - center.x < 0 && qrPoints[i+1].y - center.y < 0)
          && (qrPoints[i+2].x - center.x < 0 && qrPoints[i+2].y - center.y < 0)
          && (qrPoints[i+3].x - center.x < 0 && qrPoints[i+3].y - center.y < 0);
        
      // Top Right
      transformed[1] = (qrPoints[i].x - center.x < 0 && qrPoints[i].y - center.y >= 0)
        && (qrPoints[i+1].x - center.x < 0 && qrPoints[i+1].y - center.y >= 0)
        && (qrPoints[i+2].x - center.x < 0 && qrPoints[i+2].y - center.y >= 0)
        && (qrPoints[i+3].x - center.x < 0 && qrPoints[i+3].y - center.y >= 0);
  
      // Bottom RIght
      transformed[2] = 
        (qrPoints[i].x - center.x >=0 && qrPoints[i].y - center.y >= 0)
        && (qrPoints[i+1].x - center.x >= 0 && qrPoints[i+1].y - center.y >= 0)
        && (qrPoints[i+2].x - center.x >= 0 && qrPoints[i+2].y - center.y >= 0)
        && (qrPoints[i+3].x - center.x >= 0 && qrPoints[i+3].y - center.y >= 0);
  
      // Bottom Leftlet ary = transformDetection(qrVertices, qrRec.center, qrPoints);
  
      transformed[3] = (qrPoints[i].x - center.x >= 0 && qrPoints[i].y - center.y < 0)
        && (qrPoints[i+1].x - center.x >= 0 && qrPoints[i+1].y - center.y < 0)
        && (qrPoints[i+2].x - center.x >= 0 && qrPoints[i+2].y - center.y < 0)
        && (qrPoints[i+3].x - center.x >= 0 && qrPoints[i+3].y - center.y < 0);
      
    }
    
    let nbRotation = 0;
    if(!transformed[3]){
      nbRotation = 3;
    }else if(!transformed[0]){
      nbRotation = 2;
    }else if(!transformed[1]){
      nbRotation = 1;
    }

    console.log(transformed);
  return nbRotation;
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


function correctTimingPattern(point_a,point_b){
  if (isDiagonal(point_a, point_b)) //if diagonal
    return false;

  let timingLine = getTimingLine(point_a, point_b);

  if (timingLine.length < 10)
    return false;


  let tmp = timingLine[0];
  let size = timingLine.length
  for (let i = 0; i < size; ++i) {
    if (timingLine[i] !== tmp) {
        timingLine.splice(0, i);
        break;
    }
    if (i === size-1)
        return false;
  }

  tmp = timingLine[timingLine.length-1];
  size = timingLine.length;
  for (let i = 0; i < size; ++i) {
    if (timingLine[size - i] !== tmp) {
        timingLine.splice(size - i + 1, i);
        break;
    }
  }

  if (timingLine.length < 10)
    return false;

  let countArray = countPixels(timingLine, size);

  if (countArray.length < 5) {
    return false;
  }

  let arr = getVariance(countArray);

  return arr[0] < arr[1];
}

function getTimingLine(a, b){
  let arr = new Array();
  let sizeX = Math.abs(a.x - b.x) +1;
  let sizeY = Math.abs(a.y - b.y) +1;
  let len = sizeX > sizeY ? sizeX : sizeY;
  let x = 0;
  let y = 0;
  for (let i = 0; i < len; ++i) {
    x = a.x + Math.round((b.x - a.x) / (len - 1) * i);
    y = a.y + Math.round((b.y - a.y) / (len - 1) * i);
    let pix = thresholdedImage.ucharPtr(y, x)[0];
    arr.push(pix);
  }

  return arr;
}


function getVariance(array){
  let varMin = 5;
  let acc = 0;
  let moyenne = 0;
  let variance = 0;

  for (let i = 0; i < array.length; ++i)
    acc += array[i];

  moyenne = acc / array.length;

  for (let i = 0; i < array.length; ++i)
    variance += Math.pow((array[i] - moyenne), 2);

  variance = Math.sqrt(variance);

  return new Array(variance, varMin);
}


function countPixels(timingLine,  len){
  let array = [];
  let count = 1;
  let tmp = timingLine[0];
  for (let i = 0; i < len; ++i) {
    if (timingLine[i] == tmp)
        ++count;
    else {
        array.push(count);
        count = 1;
        tmp = timingLine[i];
    }
  }
  array.push(count);
  return array;
}

function findPositionMarkers(approx){
  let superPixels  = [];
  for (let i = 0; i < approx.length; ++i) {
      let rotatedRect = cv.minAreaRect(contourMat.get(approx[i]));
      let ratio = rotatedRect.size.width / rotatedRect.size.height
      if(isCorrectSquare(ratio)) {
        let vertices = cv.RotatedRect.points(rotatedRect);
        superPixels.push(vertices);
        // drawPositionMarkers(vertices);
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

function isDiagonal(a,b){
  return Math.abs((a.y - b.y) / (a.x - b.x)) < 1.3 && Math.abs((a.y - b.y) / (a.x - b.x)) > 0.76;
}
function isCorrectSquare(ratio){
  return ratio > 0.75 && ratio < 1.45;
}

//drawing methods 
function drawPositionMarkers(vertices){
  for (let j = 0; j < 4; j++){
    cv.line(src, vertices[j], vertices[(j + 1) % 4], [0, 255, 0, 255], 1, cv.LINE_AA, 0);
    //console.log(vertices[j], vertices[(j + 1) % 4]);
  }
   
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

function drawMarker(vertices){
  for (let i = 0; i < 4; ++i)
    cv.line(src, vertices[i], vertices[(i+1) % 4], [255, 0, 255, 255], 2)
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