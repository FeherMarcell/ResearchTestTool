<?php

require_once "./classes/LatLngBounds.class.php";


function getDistanceOfPair($trajectory1, $trajectory2, $gridSizeMeters){

	$tmpArr = array(&$trajectory1, &$trajectory2);
	if(checkBounds($tmpArr, $gridSizeMeters) === false){
		return 1;
	}




}


function checkBounds(&$trajectories, $gridSizeMeters){
    /*
     * Check bounding rectangles, advance only if they are not far
     */

    // calculate common bounds of all trajectories
    $commonBounds = LatLngBounds::fromTrajectoryArrays($trajectories);
	// calculate height and width of grid cells in lat/lon
    $gridCellLatDiff = getLatitudeDiff($gridSizeMeters);
    $avgLatitude = ($commonBounds->northEast->lat + $commonBounds->southWest->lat) / 2;
    $gridCellLonDiff = getLongitudeDiff($gridSizeMeters, $avgLatitude);

    // calculate bounds of each trajectories
    $trajectoryBounds = array();
    foreach($trajectories as &$t){
        $currentBound = LatLngBounds::fromTrajectoryArrays(array($t));
        // extend all trajectories by gridsize/2
        $currentBound->northEast->lat += $gridCellLatDiff/2;
        $currentBound->northEast->lng += $gridCellLonDiff/2;
        $trajectoryBounds[] = $currentBound;
    }

    // calculate intersection of individual trajectory bounds
    $boundsIntersection = $trajectoryBounds[0];
    for($i=1 ; $i<count($trajectoryBounds) ; $i++){
        $boundsIntersection->trimToIntersection($trajectoryBounds[$i]);
    }


    // if (extended) trajectory bounds do not intersect, there won't be common area, return null
    if($boundsIntersection->getArea() <= 0){
        return false;
    }

	return true;

}


define("EARTH_RADIUS_KM", 6378);
define("RAD", (180.0/pi()));

function getLatitudeDiff($gridSizeMeters){
    return (($gridSizeMeters/1000)/EARTH_RADIUS_KM) * RAD;
}

function getLongitudeDiff($gridSizeMeters, $latitude){
    return (($gridSizeMeters/1000)/EARTH_RADIUS_KM) * RAD / cos(deg2rad($latitude));
}