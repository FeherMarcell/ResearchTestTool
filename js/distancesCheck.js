self.addEventListener("message", function(message){
    
    var lon = 0.0;
    var currentLineStart = [0.0, 0.0];
    var currentLineEnd = [0.0, 0.0];
    var currentLineEndFarther = [0.0, 0.0];
    var currentPoint = [0.0, 0.0];
    var distDeg = 0.0, distMeters = 0.0, ratio = 1.0, moaaaarDistMeters=0.0;
    
    postMessage("Latitude;1 degrees diff in meters at given latitude;50x diff in longitude;ratio");
    
    for(var lat = 0 ; lat < 90 ; lat += 0.1){
        
        currentLineStart = new LatLon(lat, lon);
        currentLineEnd = new LatLon(lat, lon + getDegreeDiffAtLatitude(50, lat));
        
        distMeters = currentLineStart.distanceToInKms(currentLineEnd) * 1000;
        
        moaaaarDistMeters = ((currentLineStart.distanceToInKms(new LatLon(lat, lon + (50*getDegreeDiffAtLatitude(100, lat)))) * 1000)/100);
        //ratio = distMeters;
        //postMessage(new Number(lat).toPrecision(4)+"\t\t"+distMeters+"\t\t"+moaaaarDistMeters+"\t\t"+((distMeters) / moaaaarDistMeters)+"\t\t"+(distMeters / ((currentLineStart.distanceToInKms(new LatLon(lat, lon + 100)) * 1000)/100)));
        postMessage(new Number(lat).toPrecision(4)+"\t\t"+distMeters+"\t\t"+moaaaarDistMeters+"\t\t"+(distMeters - moaaaarDistMeters));
        
        /*
        postMessage("------------------");
        postMessage("lat: "+new Number(lat).toPrecision(4)+"\nratio: " + ratio);
        postMessage("Meters: " + distMeters + "\nDegrees: " + new Number(distDeg).toPrecision(5));
        */
       
        /*
        var degreDiff10 = getDegreeDiffAtLatitude(10, lat);
        var degreDiff50 = getDegreeDiffAtLatitude(50, lat);
        var degreDiff100 = getDegreeDiffAtLatitude(100, lat);
        
        var meterDiffValidation10 = (new LatLon(lat, degreDiff10)).distanceToInKms(new LatLon(lat, lon)) * 1000;
        var meterDiffValidation50 = (new LatLon(lat, degreDiff50)).distanceToInKms(new LatLon(lat, lon)) * 1000;
        var meterDiffValidation100 = (new LatLon(lat, degreDiff100)).distanceToInKms(new LatLon(lat, lon)) * 1000;
       
        postMessage(new Number(lat).toPrecision(4)+"\t\tDiff at 10m:" + new Number(meterDiffValidation10).toPrecision(6) + "\t\tDiff at 50m:" + new Number(meterDiffValidation50).toPrecision(6) + "\t\tDiff at 100m:" + new Number(meterDiffValidation100).toPrecision(6));
        */
    }
    
    
    
    
});


function getDegreeDiffAtLatitude(meterDiff, latitude){
    return meterDiff/(Math.cos(latitude.toRad()) * 111194.9266);
};

function getLatitudeOfMetersAndLatitudeDiff(metersDiff, degreesDiff){
    
    //1/degreesDiff
    
}

/**
 * Calculate the orthogonal distance from the line joining the lineStart and
 * lineEnd points to point
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

var R = 6371.0; // km
var _point, _lineStart, _lineEnd;
function orthogonalDistanceMeters(point, lineStart, lineEnd){
    _point = new LatLon(point[0], point[1]);
    _lineStart = new LatLon(lineStart[0], lineStart[1]);
    _lineEnd = new LatLon(lineEnd[0], lineEnd[1]);
    
    return Math.abs(Math.asin(Math.sin(_lineStart.distanceToInKms(_point) / R) * Math.sin(_lineStart.bearingTo(_point).toRad() - _lineStart.bearingTo(_lineEnd).toRad())) * R) * 1000;
    
}

/**
 * Checks if given points are equal both in [0] and [1] dimensions
 * 
 * @param {Array} point1
 * @param {Array} point2
 * @returns {Boolean} true if points are equal, false otherwise
 */
function pointsEqual(point1, point2){
    if((point1[0] === point2[0]) && (point1[1] === point2[1]))
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
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.distanceToInKms = function(point) {
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
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
  var dLon = (point._lon-this._lon).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);
  
  return (brng.toDeg()+360) % 360;
};

/** Converts numeric degrees to radians */
Number.prototype.toRad = function() {
  return this * Math.PI / 180;
};

/** Converts radians to numeric (signed) degrees */
Number.prototype.toDeg = function() {
  return this * 180 / Math.PI;
};

