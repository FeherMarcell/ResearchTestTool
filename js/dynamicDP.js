'use strict';

// counts the number of steps at each stage (currentMaxDistanceDegrees setting) of the algorithm
var stepsDP = 0;
var stepsDistanceCalculation = 0;
var totalTimeMS = 0.0;
var timeOfDistanceCalculations = 0.0;
/*
 * Dynamic Douglas-Peucker implementation
 * 
 * Uses GPS microdegrees distance measure first, than Haversine formula to validate
 * Re-runs microdegrees and validation until the given maximum meters distance criteria is met
 * 
 * 
 */
var resultDTO = {
            // the compressed path
            compressedPath: [],
            // distances from the original points and the compressed route points. 
            // Every original data point is paired with the compressed line segment 
            // distancesInMeters.length = originalPath.length
            distancesInMeters: [],
            avgDistance: 0.0,
            wasError: false
        };
self.addEventListener("message", function(message) {

    stepsDP = 0;
    stepsDistanceCalculation = 0;
    totalTimeMS = 0.0;
    timeOfDistanceCalculations = 0.0;

    /* INPUT VARIABLES */

    // The array of [lat, lon] arrays, values are in decimal format
    var originalPath = message.data.geoPoints;
    // Maximum distance criteria in meters, given by the user. The algorithm will run until this is met
    var maxDistanceMeters = message.data.maxDistance;
    // whether to use meter-based or degree-based DP implementation
    var distanceMeasure = "degrees";
    if (message.data.hasOwnProperty("distanceMeasure")) {
        distanceMeasure = message.data.distanceMeasure;
    }
    resultDTO.distancesInMeters = createNewFilledArray(originalPath.length, 0.0);
    
    // batch or GUI trigger
    var isBatch = message.data.hasOwnProperty("isBatch");

    //postMessage("Max distance in meters: " + maxDistanceMeters);

    /* RESULT VARIABLE (Data Transfer Object) */

    if (!isBatch) {
        
    }
    else {
        resultDTO = {
            reducedPointsNum: 0,
            stepsDP: 0,
            stepsDistanceCalculation: 0,
            retryCount: 1,
            totalTimeMS: 0.0,
            distanceCalcTimeMS: 0.0,
            fromBatch: true
        };
    }


    // Quick check, if the given path is shorter than 3 points or max distance is non-positive, it cannot be reduced
    if (originalPath.length < 3 || maxDistanceMeters <= 0) {
        // copy original point(s) to the result
        resultDTO.compressedPath = originalPath;
        // return the object
        postMessage(resultDTO);
        // stop running
        return;
    }

    /* INNER VARIABLES */

    // number of original data points
    var originalPathSize = originalPath.length;

    // vertex indexes to keep will be marked as "true", initialize the array with 'false' values
    var marked = createNewFilledArray(originalPathSize, false);

    // max distance (in meters) of each iteration
    var currentMaxDistanceMeters = 9999999.0;

    // max distance in the input data coordinate system (GPS degrees) in each iteration
    var currentDegreesTolerance = 0.0;

    // path after DP at each stage of the algorithm
    var currentReducedPath = [];

    // set first and last points 'marked', since they will always be parts of the reduced path
    marked[0] = true;
    marked[originalPathSize - 1] = true;

    //postMessage("initial degree diff: " + currentDegreesTolerance);

    var currentMaxIdx = -1;

    // <editor-fold defaultstate="collapsed" desc="Iterative implementation (not needed)">

    var d;
    if (isBatch) {
        d = Date.now();
    }

    resultDTO.wasError = false;

    try {
        
        if (distanceMeasure === "degrees") {

            //postMessage("Using distance measure based on DEGREES");
            currentDegreesTolerance = getDegreeDiffAtLatitude(maxDistanceMeters, getMaxLatitude());
            // run the recursive DP algorithm with currentMaxDistanceDegrees
            douglasPeuckerReduction(0, originalPathSize - 1);

            // get the current reduced path
            currentReducedPath = getMarkedPoints();

            // calculate new 'currentMaxDistanceMeters' value according to the new path
            //currentMaxDistanceMeters = getCurrentMaxDistanceInMeters();

            // for debug only
            if (!isBatch)
                resultDTO.compressedPath = currentReducedPath;

            // the algorithm will run until the desired max deviation distance is not achieved
            //while(currentMaxDistanceMeters > maxDistanceMeters){
            /*
             postMessage(" ------------------------------------ ");
             postMessage("Last round max distance was: " + currentMaxDistanceMeters);
             postMessage("Starting new stage with degrees tolerance: " + currentDegreesTolerance);
             */

            // TODO put back here

            //resultDTO.distancesInMeters = currentMaxDistanceMeters;
            //postMessage(resultDTO);
            /*
             
             // TODO select an appropriate distance in degrees for the next run
             if(currentMaxDistanceMeters > maxDistanceMeters){
             // if there will be a next run
             currentDegreesTolerance *= .9;
             //postMessage(resultDTO);
             
             //get degrees value at the given latitude of the error
             var currentErrorMeters = currentMaxDistanceMeters - maxDistanceMeters;
             
             var degreeDiff = getDegreeDiffAtLatitude(currentErrorMeters, getMaxLatitude());
             //postMessage("Current error: " + currentErrorMeters + "m\n("+degreeDiff+" degrees)");
             currentDegreesTolerance -= degreeDiff;
             
             //postMessage("new tolerance for the next round: \n" + currentDegreesTolerance);
             
             //currentDegreesTolerance *= .9; // tolerance: 90% of the previous
             }
             */

            //}

        }
        else if (distanceMeasure === "meters") {
            //postMessage("Using distance measure based on METERS");

            douglasPeuckerReductionMetersDistance(0, originalPathSize - 1);

            // get the current reduced path
            currentReducedPath = getMarkedPoints();

            // calculate new 'currentMaxDistanceMeters' value according to the new path
            //currentMaxDistanceMeters = getCurrentMaxDistanceInMeters();

            // for debug only
            if (!isBatch)
                resultDTO.compressedPath = currentReducedPath;
            //resultDTO.distancesInMeters = currentMaxDistanceMeters;
        }
       
    } catch (exception) {
        // most likely call stack was exceeded
        //postMessage(exception);
        resultDTO.wasError = true;
        postMessage(resultDTO);
        return;
    }

    if (isBatch) {
        resultDTO.totalTimeMS = Date.now() - d;
        resultDTO.reducedPointsNum = currentReducedPath.length;
        resultDTO.stepsDP = stepsDP;
        resultDTO.stepsDistanceCalculation = stepsDistanceCalculation;
        resultDTO.distanceCalcTimeMS = timeOfDistanceCalculations;
        postMessage(resultDTO);
        return;
    }


    /*
     postMessage("Total steps: " + stepsDP);
     postMessage("Distance calc time: " + timeOfDistanceCalculations + "ms");
     */

    // </editor-fold>

    /*
     // run the recursive DP algorithm with currentMaxDistanceDegrees
     douglasPeuckerReduction(0, originalPathSize-1);
     
     // get the current reduced path
     currentReducedPath = getMarkedPoints();
     
     // calculate new 'currentMaxDistanceMeters' value according to the new path
     currentMaxDistanceMeters = getCurrentMaxDistanceInMeters();
     
     // 'currentReducedPath' now contains the final reduced path
     resultDTO.compressedPath = currentReducedPath;
     resultDTO.distancesInMeters  = currentMaxDistanceMeters;
     */

    // return the result
    postMessage(resultDTO);
    // finish running
    return;


    /* INNER FUNCTIONS */


    // <editor-fold defaultstate="collapsed" desc="douglasPeuckerReduction()">
    // declare frequently-used variables once
    var indexFarthest = 0;
    var currentMaxDistanceDegrees = 0.0, currentDistanceDegrees = 0.0;
    var firstPoint = [], lastPoint = [];
    var dpIdx = 0; // the running index of foreach
    function douglasPeuckerReduction(firstIdx, lastIdx) {
        stepsDP++;

        if (lastIdx <= firstIdx + 1) {
            // overlapping indexes, just return
            return;
        }
        indexFarthest = 0;
        // loop over the points between the first and last points
        // and find the point that is the farthest away
        currentMaxDistanceDegrees = 0.0;
        currentDistanceDegrees = 0.0;
        firstPoint = originalPath[firstIdx];
        lastPoint = originalPath[lastIdx];

        for (dpIdx = firstIdx + 1; dpIdx < lastIdx; dpIdx++) {

            currentDistanceDegrees = orthogonalDistanceDegreesFast(originalPath[dpIdx], firstPoint, lastPoint);

            // keep the point with the greatest distance
            if (currentDistanceDegrees > currentMaxDistanceDegrees) {
                currentMaxDistanceDegrees = currentDistanceDegrees;
                indexFarthest = dpIdx;
            }
        }

        if (currentMaxDistanceDegrees > currentDegreesTolerance) {
            //The farthest point is outside the tolerance: it is marked and the algorithm continues. 
            marked[indexFarthest] = true;

            // reduce the shape between the starting point to newly found point
            douglasPeuckerReduction(firstIdx, indexFarthest);

            // reduce the shape between the newly found point and the finishing point
            douglasPeuckerReduction(indexFarthest, lastIdx);
        }

        //else: the farthest point is within the tolerance, the whole segment is discarded, nothing to do
    }

    var indexFarthest = 0;
    var currentMaxDistanceMeters = 0.0, currentDistanceMeters = 0.0;
    var firstPoint = [], lastPoint = [];
    var dpIdx = 0; // the running index of foreach
    function douglasPeuckerReductionMetersDistance(firstIdx, lastIdx) {
        stepsDP++;

        if (lastIdx <= firstIdx + 1) {
            // overlapping indexes, just return
            return;
        }
        indexFarthest = 0;
        // loop over the points between the first and last points
        // and find the point that is the farthest away
        currentMaxDistanceMeters = 0.0;
        currentDistanceMeters = 0.0;
        firstPoint = originalPath[firstIdx];
        lastPoint = originalPath[lastIdx];

        for (dpIdx = firstIdx + 1; dpIdx < lastIdx; dpIdx++) {

            currentDistanceMeters = orthogonalDistanceMeters(originalPath[dpIdx], firstPoint, lastPoint);

            // keep the point with the greatest distance
            if (currentDistanceMeters > currentMaxDistanceMeters) {
                currentMaxDistanceMeters = currentDistanceMeters;
                indexFarthest = dpIdx;
            }
        }

        if (currentMaxDistanceMeters > maxDistanceMeters) {
            //The farthest point is outside the tolerance: it is marked and the algorithm continues. 
            marked[indexFarthest] = true;

            // reduce the shape between the starting point to newly found point
            douglasPeuckerReductionMetersDistance(firstIdx, indexFarthest);

            // reduce the shape between the newly found point and the finishing point
            douglasPeuckerReductionMetersDistance(indexFarthest, lastIdx);
        }

        //else: the farthest point is within the tolerance, the whole segment is discarded, nothing to do
    }

    // </editor-fold>

    function getMaxLatitude() {
        var max = 0.0;
        for (var idx in originalPath) {
            if (originalPath[idx][0] > max)
                max = originalPath[idx][0];
        }

        return new Number(max);
    }

    function getCurrentMaxDistanceInMeters() {
        var compressedRouteCurrentEndpointIdx = 1;
        var currentDistanceMeters = 0.0;
        var maxDistance = 0.0, sumDistanceMeters = 0.0;

        var logSteps = false;
        var currentMaxDegrees = 0.0;
        // reset
        currentMaxIdx = -1;
        if (logSteps) {
            postMessage("getCurrentMaxDistanceInMeters START\n----------------------------");
            postMessage("currentReducedPath:");
            for (var idx in currentReducedPath) {
                postMessage("[" + idx + "] - (" + currentReducedPath[idx][0] + ", " + currentReducedPath[idx][1] + ")");
            }
            postMessage("");
        }

        var maxIdxLineStart, maxIdxLineEnd;

        for (var idx = 1; idx < originalPathSize; idx++) {
            if (logSteps) {
                postMessage("idx: " + idx);
                postMessage("compressedRouteCurrentEndpointIdx: " + compressedRouteCurrentEndpointIdx);
                postMessage("originalPath[idx]: (" + originalPath[idx][0] + ", " + originalPath[idx][1] + ")");
                postMessage("line start: (" + currentReducedPath[compressedRouteCurrentEndpointIdx - 1][0] + ", " + currentReducedPath[compressedRouteCurrentEndpointIdx - 1][1] + ")");
                postMessage("line end (check): (" + currentReducedPath[compressedRouteCurrentEndpointIdx][0] + ", " + currentReducedPath[compressedRouteCurrentEndpointIdx][1] + ")");
            }

            if (!pointsEqual(originalPath[idx], currentReducedPath[compressedRouteCurrentEndpointIdx])) {

                // calculate distance in meters
                currentDistanceMeters = orthogonalDistanceMeters(originalPath[idx], currentReducedPath[compressedRouteCurrentEndpointIdx - 1], currentReducedPath[compressedRouteCurrentEndpointIdx]);

                if (logSteps) {
                    //postMessage("orthogonalDistanceMeters: " + currentDistanceMeters + "m");
                    //postMessage("");
                }

                // set new max value if found
                if (currentDistanceMeters > maxDistance) {
                    maxDistance = currentDistanceMeters;
                    //currentMaxDegrees = orthogonalDistanceDegreesFast(originalPath[idx], currentReducedPath[compressedRouteCurrentEndpointIdx-1], currentReducedPath[compressedRouteCurrentEndpointIdx]);
                    //currentMaxIdx = idx;
                    //maxIdxLineStart = currentReducedPath[compressedRouteCurrentEndpointIdx-1];
                    //maxIdxLineEnd = currentReducedPath[compressedRouteCurrentEndpointIdx];
                    /*
                     if(currentMaxIdx === 180){
                     postMessage("originalPath[idx]: ("+originalPath[idx][0]+", "+originalPath[idx][1]+")");
                     postMessage("line start: ("+currentReducedPath[compressedRouteCurrentEndpointIdx-1][0]+", "+currentReducedPath[compressedRouteCurrentEndpointIdx-1][1]+")");
                     postMessage("line end (check): ("+currentReducedPath[compressedRouteCurrentEndpointIdx][0]+", "+currentReducedPath[compressedRouteCurrentEndpointIdx][1]+")");
                     }
                     */
                }

                // add to sum (not used now)
                sumDistanceMeters += currentDistanceMeters;

            }
            else {
                // distance is zero
                compressedRouteCurrentEndpointIdx++;
                if (logSteps) {
                    postMessage("skip");
                }
            }
            if (logSteps) {
                postMessage("--- Iter finish ----");
            }
        }
        //postMessage("Max distance in degrees: " + currentMaxDegrees);

        resultDTO.avgDistance = (sumDistanceMeters * 1.0) / (originalPathSize * 1.0);

        /*
         resultDTO.maxDistanceIndex = currentMaxIdx;
         resultDTO.maxDistanceLineStart = maxIdxLineStart;
         resultDTO.maxDistanceLineEnd = maxIdxLineEnd;
         */

        //postMessage("Current max index: " + currentMaxIdx + ", distance: " + maxDistance);
        return maxDistance;
    }

    function printPoint(point) {
        return " " + point[0] + "\n " + point[1];
    }

    function getMarkedPoints() {
        var result = [];
        for (var idx in marked) {
            if (marked[idx] === true) {
                result.push(originalPath[idx]);
            }
        }
        return result;
    }
});

/* Helper functions */


function getDegreeDiffAtLatitude(meterDiff, latitude) {
    //return meterDiff / (Math.cos(latitude.toRad()) * 111194.9266);
    return meterDiff / getOneMeterDiffAtLatitide(latitude);
}

function getOneMeterDiffAtLatitide(latitude){
    return 111132.954 - 559.822*Math.cos(2*latitude) + 1.175*Math.cos(4*latitude);
}

/**
 * Creates a new array with the given length and fills every place with the given value.
 * Faster than runtime adding new items
 * 
 * @param {int} length The desired length
 * @param {any} val The value to be put in every array item
 * @returns {Array} The pre-filled array of the desired size
 */
function createNewFilledArray(length, val) {
    var array = [];
    var i = 0;
    while (i < length) {
        array[i++] = val;
    }
    return array;
}

/**
 * Calculate the orthogonal distance from the line joining the lineStart and
 * lineEnd points to point
 * 
 * Method: h = (area / base) * 2
 * http://easycalculation.com/analytical/altitude-of-triangles.php
 * 
 * @param point
 *            The point the distance is being calculated for
 * @param lineStart
 *            The point that starts the line
 * @param lineEnd
 *            The point that ends the line
 * @return The distance in points coordinate system
 */
var area, x, y, bottom;
function orthogonalDistanceDegrees(point, lineStart, lineEnd) {
    stepsDistanceCalculation++;
    area = Math.abs(
            (
                    1.0 * lineStart[0] * lineEnd[1] + 1.0 * lineEnd[0] * point[1] + 1.0 * point[0] * lineStart[1]
                    - 1.0 * lineEnd[0] * lineStart[1] - 1.0 * point[0] * lineEnd[1] - 1.0 * lineStart[0] * point[1]
                    ) / 2.0
            );
    x = lineStart[0] - lineEnd[0];
    y = lineStart[1] - lineEnd[1];
    bottom = Math.sqrt(x * x + y * y);
    return (area / bottom * 2.0);
}


var Dp = 0.0, Dq = 0.0;
var startTime = 0.0;
function orthogonalDistanceDegreesFast(point, lineStart, lineEnd) {
    stepsDistanceCalculation++;
    startTime = Date.now()

    Dp = lineStart[0] - lineEnd[0];
    Dq = lineStart[1] - lineEnd[1];
    var result = Math.abs(1.0 * Dq * point[0] - 1.0 * Dp * point[1] + 1.0 * lineStart[0] * lineEnd[1] - 1.0 * lineStart[1] * lineEnd[0]) / Math.sqrt(Dp * Dp + Dq * Dq);

    timeOfDistanceCalculations += (Date.now() - startTime);
    return result;
}

var R = 6371.0; // km
var _point, _lineStart, _lineEnd;
function orthogonalDistanceMeters(point, lineStart, lineEnd) {
    stepsDistanceCalculation++;
    startTime = Date.now();

    _point = new LatLon(point[0], point[1]);
    _lineStart = new LatLon(lineStart[0], lineStart[1]);
    _lineEnd = new LatLon(lineEnd[0], lineEnd[1]);
    var result = Math.abs(Math.asin(Math.sin((_lineStart.distanceTo(_point)) / R) * Math.sin(_lineStart.bearingTo(_point).toRad() - _lineStart.bearingTo(_lineEnd).toRad())) * R) * 1000;

    timeOfDistanceCalculations += (Date.now() - startTime);
    return result;
}


/**
 * Calculates the distance from that point to the great circle that passes
 * by the two points given as arguments.
 * @param a firt point
 * @param b second point
 * @return the distance, in meters
 */
/*
 public static double distanceToGreatCircle(TrackPoint p, TrackPoint a,
 TrackPoint b) {
 double lata = Math.toRadians(a.getLat());
 double lnga = Math.toRadians(a.getLng());
 double latb = Math.toRadians(b.getLat());
 double lngb = Math.toRadians(b.getLng());
 double latp = Math.toRadians(p.getLat());
 double lngp = Math.toRadians(p.getLng());
 double sinlata = Math.sin(lata);
 double coslata = Math.cos(lata);
 double sinlnga = Math.sin(lnga);
 double coslnga = Math.cos(lnga);
 double sinlatb = Math.sin(latb);
 double coslatb = Math.cos(latb);
 double sinlngb = Math.sin(lngb);
 double coslngb = Math.cos(lngb);
 double sinlatp = Math.sin(latp);
 double coslatp = Math.cos(latp);
 double sinlngp = Math.sin(lngp);
 double coslngp = Math.cos(lngp);
 double costh = sinlata*sinlatb + coslata*coslatb*(coslnga*coslngb+sinlnga*sinlngb);
 double sin2th = 1-costh*costh;
 
 if (sin2th < 1.0E-20) {
 // return distance from a to p
 double costhp = sinlata*sinlatp + coslata*coslatp*(coslnga*coslngp + sinlnga*sinlngp);
 return Math.acos(costhp)*(R+p.getH());
 }
 double num = sinlata*(coslatb*coslatp*coslngb*sinlngp
 - coslatb*coslatp*sinlngb*coslngp)
 + coslata*coslnga*(coslatb*sinlatp*sinlngb
 - sinlatb*coslatp*sinlngp)
 + coslata*sinlnga*(sinlatb*coslatp*coslngp
 - coslatb*sinlatp*coslngb);
 
 double sinr = Math.abs(num)/Math.sqrt(sin2th);
 return (R+p.getH())*Math.asin(sinr);
 }
 */

/**
 * Checks if given points are equal both in [0] and [1] dimensions
 * 
 * @param {Array} point1
 * @param {Array} point2
 * @returns {Boolean} true if points are equal, false otherwise
 */
function pointsEqual(point1, point2) {
    if ((point1[0] === point2[0]) && (point1[1] === point2[1]))
        return true;
    return false;
}



/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2012            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new LatLon(51.5136, -0.0983);                                                      */
/*    var p2 = new LatLon(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/*    var brng = p1.bearingTo(p2);           // in degrees clockwise from north                   */
/*    ... etc                                                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lat latitude in numeric degrees
 * @param {Number} lon longitude in numeric degrees
 */
function LatLon(lat, lon) {
    this._lat = typeof(lat) === 'number' ? lat : typeof(lat) === 'string' && lat.trim() !== '' ? +lat : NaN;
    this._lon = typeof(lon) === 'number' ? lon : typeof(lon) === 'string' && lon.trim() !== '' ? +lon : NaN;
}


/**
 * Returns the distance from this point to the supplied point, in km 
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {LatLon} point Latitude/longitude of destination point in decimal degrees
 * @returns {Number} Distance in m between this point and destination point
 */
LatLon.prototype.distanceTo = function(point) {
    var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
    var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
    var dLat = lat2 - lat1;
    var dLon = lon2 - lon1;

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * R;
};


/**
 * Returns the (initial) bearing from this point to the supplied point, in degrees
 *   see http://williams.best.vwh.net/avform.htm#Crs
 *
 * @param   {LatLon} point Latitude/longitude of destination point
 * @returns {Number} Initial bearing in degrees from North
 */
LatLon.prototype.bearingTo = function(point) {
    var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
    var dLon = (point._lon - this._lon).toRad();

    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    var brng = Math.atan2(y, x);

    return (brng.toDeg() + 360) % 360;
};

/** Converts numeric degrees to radians */
Number.prototype.toRad = function() {
    return this * Math.PI / 180;
};

/** Converts radians to numeric (signed) degrees */
Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
};

