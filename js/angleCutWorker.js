"use strict";

//importScripts('googleMapsMain.js');
//importScripts('googleMapsGeometry.js');


self.addEventListener("message", function(message){
    
    // The array of [lat, lon] arrays, values are in decimal format
    var originalPath = message.data.geoPoints;
    
    // Maximum distance criteria in meters, given by the user. The algorithm will run until this is met
    var minAngle = message.data.minAngle;
    
    postMessage("Angle cut compression with min angle " + minAngle + "<br/>");
    
    var resultDTO = {
        // the compressed path
        compressedPath: [],
        angles: []
        // distances from the original points and the compressed route points. 
        // Every original data point is paired with the compressed line segment 
        // distancesInMeters.length = originalPath.length
        //distancesInMeters: createNewFilledArray(originalPath.length, 0.0),
        //avgDistance: 0.0
    };
    
    //postMessage(originalPath);
    
    // add first point
    resultDTO.compressedPath.push(originalPath[0]);
    resultDTO.angles.push("Not defined");
    
    var log = false;
    
    var slope1 = 0.0, slope2 = 0.0, angle = 0.0;
    var startPoint = originalPath[0], midPoint = originalPath[0], lastPoint = originalPath[0];
    var startIdx = 0, midIdx = 1;
    if(log) postMessage("OriginalPath length: " + originalPath.length);
    for(var idx = 1 ; idx < originalPath.length-1 ; idx++){
        if(log) postMessage("");
        /*
        startPoint = originalPath[(idx-1)];
        midPoint = originalPath[idx];
        lastPoint = originalPath[(idx+1)];
        */
        startPoint = originalPath[startIdx];
        midPoint = originalPath[midIdx];
        lastPoint = originalPath[(midIdx+1)];
        
        if(pointsEqual(startPoint, midPoint) || pointsEqual(midPoint, lastPoint)){
            if(idx < 13){
                if(log) postMessage("Equal points, DISCARD: " + startIdx + ", " + midIdx + ", " + (midIdx+1));
            }
            midIdx++;
            continue;
        }
        
        slope1 = (midPoint[0] === startPoint[0]) ? 99999999 : ((midPoint[1] - startPoint[1]) / (midPoint[0] - startPoint[0]));
        slope2 = (lastPoint[0] === midPoint[0]) ? 99999999 : ((lastPoint[1] - midPoint[1]) / (lastPoint[0] - midPoint[0]));
        
        //angle = Math.atan(Math.abs(slope1-slope2)).toDeg();
        angle = Math.atan(Math.abs( (slope2 - slope1) / (1 + slope1 * slope2)) ).toDeg();
        
        
        if(log){
            if(idx < 13 || isNaN(angle)){
                postMessage("Index of start point: " + startIdx);
                postMessage("Index of midpoint: " + midIdx);
                postMessage("slope1: " + slope1);
                postMessage("slope2: " + slope2);

                postMessage("tan(alpha): " + Math.abs( (slope1 - slope2) / (1 + slope1 * slope2)));
                postMessage("alpha: " + angle);
                //postMessage("");
            }
        }
        
        
        //postMessage("alpha: " + angle);
        
        if( angle >= minAngle ){
            if(idx < 13){
                if(log) postMessage("Point KEEP");
            }
            resultDTO.compressedPath.push(midPoint);
            resultDTO.angles.push(angle + "(slope1: "+slope1+", slope2: "+slope2+")");
            
            startIdx = midIdx;
            midIdx++;
        }
        else{
            if(idx < 13){
                if(log) postMessage("Point DISCARDED");
            }
            midIdx++;
        }
    }
    
    // add last point
    resultDTO.compressedPath.push(originalPath[(originalPath.length-1)]);
    resultDTO.angles.push("Not defined");
    postMessage(resultDTO);
    
    
    
});


/** Converts numeric degrees to radians */
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};

/** Converts radians to numeric (signed) degrees */
Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
};

function pointsEqual(point1, point2){
    if((point1[0] === point2[0]) && (point1[1] === point2[1]))
        return true;
    return false;
}