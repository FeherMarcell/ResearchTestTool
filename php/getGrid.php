<?php

require_once './classes/LatLng.class.php';
require_once './classes/LatLngBounds.class.php';
require_once './classes/GridCell.class.php';

define("EARTH_RADIUS_KM", 6378);
define("RAD", (180.0/pi()));

//global $GRID_PRIMARY, $GRID_SECONDARY;

global $gridCellLatDiff;
global $gridCellLonDiff;

global $distinctCommonCellsNum;
global $overlappingCommonCellsNum;

function getDistanceOfPair($trajectory1, $trajectory2, $gridSizeMeters){
    $result = getGrid(null, $gridSizeMeters, 3, false, array($trajectory1, $trajectory2));
    if($result == null){
        return 1;
    }
    return $result["stats"]["common"]["similarity"]-0;
}

function getGrid($trajectories, $gridSizeMeters, $whichGrid, $onlyForIntersection=false, $trajectoriesLatLngs = false){

    global $gridCellLatDiff;
    global $gridCellLonDiff;

    global $distinctCommonCellsNum;
    global $overlappingCommonCellsNum;

    $result = array();

    if($trajectoriesLatLngs === false){
        // convert trajectories to arrays of LatLng objects
        for($i=0 ; $i<count($trajectories) ; $i++){
            $trajectories[$i] = array_map( array("LatLng", "fromArray"), $trajectories[$i]);
        }
    }
    else{
        $trajectories = $trajectoriesLatLngs;
    }


    /*
     * Check bounding rectangles, advance only if they are not far
     */

    // calculate common bounds of all trajectories
    $commonBounds = LatLngBounds::fromTrajectories($trajectories);

    // calculate height and width of grid cells in lat/lon
    $gridCellLatDiff = getLatitudeDiff($gridSizeMeters);
    $avgLatitude = ($commonBounds->northEast->lat + $commonBounds->southWest->lat) / 2;
    $gridCellLonDiff = getLongitudeDiff($gridSizeMeters, $avgLatitude);

    // calculate bounds of each trajectories
    $trajectoryBounds = array();
    foreach($trajectories as $t){
        $currentBound = LatLngBounds::fromTrajectories(array($t));
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
    $result["boundsIntersection"] = $boundsIntersection;

    // if (extended) trajectory bounds do not intersect, there won't be common area, return null
    if($boundsIntersection->getArea() <= 0){
        return null;
    }



    // calculate grid only for the intersection area of given trajectories
    if($onlyForIntersection){
        $commonBounds->northEast = $boundsIntersection->northEast;
        $commonBounds->southWest = $boundsIntersection->southWest;
    }

    /*  */
    $GRID_PRIMARY = array(); $GRID_SECONDARY = array();

    // calculate grid sizes
    $sumLatSpan = abs($commonBounds->northEast->lat - $commonBounds->southWest->lat);
    $sumLonSpan = abs($commonBounds->northEast->lng - $commonBounds->southWest->lng);

    // Primary
    $latCellsNumPrimary = ceil($sumLatSpan / $gridCellLatDiff);
    $lonCellsNumPrimary = ceil($sumLonSpan / $gridCellLonDiff);

    //echo "lat cells: " . $latCellsNumPrimary . "/n";
    //echo "lon cells: " . $lonCellsNumPrimary . "/n";

    //SECONDARY
    $latCellsNumSecondary = $latCellsNumPrimary + 1;
    $lonCellsNumSecondary = $lonCellsNumPrimary + 1;

    
    // OLD METHOD, grid starts at upper right corner (NorthEast)
    // calculate coordinates of grids (only if client required)
    if($whichGrid < 3){
        $latGridCoordsPrimary = array(); $lonGridCoordsPrimary = array();
        $latGridCoordsSecondary = array(); $lonGridCoordsSecondary = array();

        for($i=0 ; $i<=$latCellsNumPrimary ; $i++){
            // PRIMARY
            $latGridCoordsPrimary[] = $commonBounds->northEast->lat - (($i) * $gridCellLatDiff);
            //SECONDARY
            $latGridCoordsSecondary[] = $commonBounds->northEast->lat - (($i-0.5) * $gridCellLatDiff);
        }
        $latGridCoordsSecondary[] = $commonBounds->northEast->lat - (($i-0.5) * $gridCellLatDiff);
        for($i=0 ; $i<=$lonCellsNumPrimary ; $i++){
            // PRIMARY
            $lonGridCoordsPrimary[] = $commonBounds->northEast->lng - (($i) * $gridCellLonDiff);
            //SECONDARY
            $lonGridCoordsSecondary[] = $commonBounds->northEast->lng - (($i-0.5) * $gridCellLonDiff);
        }
        $lonGridCoordsSecondary[] = $commonBounds->northEast->lng - (($i-0.5) * $gridCellLonDiff);
    }
    
    /*
    // new method, grid starts at lower left corner (SouthWest)
    if($whichGrid < 3){
        $latGridCoordsPrimary = array(); $lonGridCoordsPrimary = array();
        $latGridCoordsSecondary = array(); $lonGridCoordsSecondary = array();

        for($i=0 ; $i<=$latCellsNumPrimary ; $i++){
            // PRIMARY
            $latGridCoordsPrimary[] = $commonBounds->southWest->lat + (($i) * $gridCellLatDiff);
            //SECONDARY
            $latGridCoordsSecondary[] = $commonBounds->southWest->lat + (($i-0.5) * $gridCellLatDiff);
        }
        $latGridCoordsSecondary[] = $commonBounds->southWest->lat + (($i-0.5) * $gridCellLatDiff);
        for($i=0 ; $i<=$lonCellsNumPrimary ; $i++){
            // PRIMARY
            $lonGridCoordsPrimary[] = $commonBounds->southWest->lng + (($i) * $gridCellLonDiff);
            //SECONDARY
            $lonGridCoordsSecondary[] = $commonBounds->southWest->lng + (($i-0.5) * $gridCellLonDiff);
        }
        $lonGridCoordsSecondary[] = $commonBounds->southWest->lng + (($i-0.5) * $gridCellLonDiff);
    }
     
     
    
    if($whichGrid == 1){
        $result["gridCoords"]["lat"] = $latGridCoordsPrimary;
        $result["gridCoords"]["lon"] = $lonGridCoordsPrimary;
    }
    else if($whichGrid == 0){
        $result["gridCoords"]["lat"] = $latGridCoordsSecondary;
        $result["gridCoords"]["lon"] = $lonGridCoordsSecondary;
    }
    else if($whichGrid == 2){
        $result["gridCoords"]["lat"] = array_merge($latGridCoordsPrimary, $latGridCoordsSecondary);
        $result["gridCoords"]["lon"] = array_merge($lonGridCoordsPrimary, $lonGridCoordsSecondary);
    }
    
    //return $result;
    */

    // set up grid cells
    // PRIMARY
    for($i=0 ; $i<$latCellsNumPrimary ; $i++){
        for($j=0 ; $j<$lonCellsNumPrimary ; $j++){
            $GRID_PRIMARY[$i][$j] = new GridCell(

                    new LatLngBounds(
                        new LatLng($commonBounds->northEast->lat - (($i-0) * $gridCellLatDiff), $commonBounds->northEast->lng - (($j-0) * $gridCellLonDiff)),
                        new LatLng($commonBounds->northEast->lat - (($i+1) * $gridCellLatDiff), $commonBounds->northEast->lng - (($j+1) * $gridCellLonDiff))
                        )
                    );
        }
    }
    
    //print_r($GRID_PRIMARY);

    // SECONDARY
    for($i=0 ; $i<$latCellsNumSecondary ; $i++){
        for($j=0 ; $j<$lonCellsNumSecondary ; $j++){
            $GRID_SECONDARY[$i][$j] = new GridCell(
                    new LatLngBounds(
                        new LatLng($commonBounds->northEast->lat - (($i-0.5) * $gridCellLatDiff), $commonBounds->northEast->lng - (($j-0.5) * $gridCellLonDiff)),
                        new LatLng($commonBounds->northEast->lat - (($i+.5) * $gridCellLatDiff), $commonBounds->northEast->lng - (($j+.5) * $gridCellLonDiff))
                        )
                    );
        }
    }

    // Fill grid cell coordinates
    for($trIdx=0 ; $trIdx < count($trajectories) ; $trIdx++){

        // zeroth point
        $trajectories[$trIdx][0]->gridCellCoordsPrimary = getGridCellIndiciesOfPoint($GRID_PRIMARY[0][0]->bounds->northEast, $trajectories[$trIdx][0]);
        $trajectories[$trIdx][0]->gridCellCoordsSecondary = getGridCellIndiciesOfPoint($GRID_SECONDARY[0][0]->bounds->northEast, $trajectories[$trIdx][0]);
        $GRID_PRIMARY[$trajectories[$trIdx][0]->gridCellCoordsPrimary[0]][$trajectories[$trIdx][0]->gridCellCoordsPrimary[1]]->addToCrossing($trIdx);
        $GRID_SECONDARY[$trajectories[$trIdx][0]->gridCellCoordsSecondary[0]][$trajectories[$trIdx][0]->gridCellCoordsSecondary[1]]->addToCrossing($trIdx);

        for($i=1 ; $i<count($trajectories[$trIdx]) ; $i++){

            $startLatLng = $trajectories[$trIdx][$i-1];
            $endLatLng = $trajectories[$trIdx][$i];

            // calculate which grid cell is the current point in
            $trajectories[$trIdx][$i]->gridCellCoordsPrimary = getGridCellIndiciesOfPoint($GRID_PRIMARY[0][0]->bounds->northEast, $trajectories[$trIdx][$i]);
            $trajectories[$trIdx][$i]->gridCellCoordsSecondary = getGridCellIndiciesOfPoint($GRID_SECONDARY[0][0]->bounds->northEast, $trajectories[$trIdx][$i]);

            if($trajectories[$trIdx][$i]->gridCellCoordsPrimary[0] > count($GRID_PRIMARY)-1 || $trajectories[$trIdx][$i]->gridCellCoordsPrimary[1] > count($GRID_PRIMARY[0])-1){
                echo "kicimzes!! NE: \n"; print_r($commonBounds->northEast);
                echo "\n\npoint: \n"; print_r($trajectories[$trIdx][$i]);
            }

            // add current trajectory index to the calculated grid cell's 'crossingTrajectoryIds' array
            $GRID_PRIMARY[$trajectories[$trIdx][$i]->gridCellCoordsPrimary[0]][$trajectories[$trIdx][$i]->gridCellCoordsPrimary[1]]->addToCrossing($trIdx);
            $GRID_SECONDARY[$trajectories[$trIdx][$i]->gridCellCoordsSecondary[0]][$trajectories[$trIdx][$i]->gridCellCoordsSecondary[1]]->addToCrossing($trIdx);

            // they are in the same or neighboring cell
            if(!$startLatLng->isInSameCell($endLatLng, true) && !$startLatLng->isInNeighborCell($endLatLng, true)){
                markCellsOfRoute($GRID_PRIMARY, $startLatLng, $endLatLng, $trIdx, $result, true);
            }
            if(!$startLatLng->isInSameCell($endLatLng, false) && !$startLatLng->isInNeighborCell($endLatLng, false)){
                markCellsOfRoute($GRID_SECONDARY, $startLatLng, $endLatLng, $trIdx, $result, false);
            }
        }
    }


    // illeszkedesi szazalek vizsgalata
    $allCellsNum = 0; $commonCellsNum = 0;
    foreach($GRID_PRIMARY as $row){
        foreach($row as $cell){
            if(count($cell->crossingTrajectoryIds) > 0){
                $allCellsNum++;
                if(count($cell->crossingTrajectoryIds) == count($trajectories)){
                    $commonCellsNum++;
                }
            }
        }
    }

    $result["stats"]["primary"]["allCellsNum"] = $allCellsNum;
    $result["stats"]["primary"]["commonCellsNum"] = $commonCellsNum;
    $result["stats"]["primary"]["similarity"] = ($commonCellsNum / $allCellsNum)*100 . "%";

    $allCellsNum = 0; $commonCellsNum = 0;
    foreach($GRID_SECONDARY as $row){
        foreach($row as $cell){
            if(count($cell->crossingTrajectoryIds) > 0){
                $allCellsNum++;
                if(count($cell->crossingTrajectoryIds) == count($trajectories)){
                    $commonCellsNum++;
                }
            }
        }
    }

    $result["stats"]["secondary"]["allCellsNum"] = $allCellsNum;
    $result["stats"]["secondary"]["commonCellsNum"] = $commonCellsNum;
    $result["stats"]["secondary"]["similarity"] = ($commonCellsNum / $allCellsNum)*100 . "%";


    $COMMON_GRID = calculateCommonGrid($GRID_PRIMARY, $GRID_SECONDARY, count($trajectories));

    $result["stats"]["common"]["allCellsNum"] = $distinctCommonCellsNum;
    $result["stats"]["common"]["commonCellsNum"] = $overlappingCommonCellsNum;
    $result["stats"]["common"]["similarity"] = ($distinctCommonCellsNum==0 ? 0 : ($overlappingCommonCellsNum / $distinctCommonCellsNum)) . "";


    /*******************************************************************/
    /*  BOTH GRID_PRIMARY AND GRID_SECONDARY ARE FULLY SET UP BY HERE  */
    /*******************************************************************/



    if($whichGrid == 1){
        $result["gridCoords"]["lat"] = $latGridCoordsPrimary;
        $result["gridCoords"]["lon"] = $lonGridCoordsPrimary;

        $result["grid"] = $GRID_PRIMARY;
    }
    else if($whichGrid == 0){
        $result["gridCoords"]["lat"] = $latGridCoordsSecondary;
        $result["gridCoords"]["lon"] = $lonGridCoordsSecondary;

        $result["grid"] = $GRID_SECONDARY;
    }
    else if($whichGrid == 2){
        $result["gridCoords"]["lat"] = array_merge($latGridCoordsPrimary, $latGridCoordsSecondary);
        $result["gridCoords"]["lon"] = array_merge($lonGridCoordsPrimary, $lonGridCoordsSecondary);

        $result["grid"] = array_merge($GRID_PRIMARY, $GRID_SECONDARY);
    }



    $result["common_grid"] = $COMMON_GRID;

    return $result;
}



function calculateCommonGrid($primaryGrid, $secondaryGrid, $numberOfTrajectories){

    global $distinctCommonCellsNum;
    global $overlappingCommonCellsNum;

    $distinctCommonCellsNum = 0;
    $overlappingCommonCellsNum = 0;

    $resultCells = array();

    $smallCellsTotalNum = 0;

    for($rowIdx=0 ; $rowIdx < count($primaryGrid) ; $rowIdx++){
        for($colIdx=0 ; $colIdx < count($primaryGrid[0]) ; $colIdx++){

            $primaryCell = $primaryGrid[$rowIdx][$colIdx];
            /* @var $primaryCell GridCell */

            if(count($primaryCell->crossingTrajectoryIds) == 0){
                continue;
            }
            //$distinctCommonCellsNum += 4;


            if(count($primaryCell->crossingTrajectoryIds) < $numberOfTrajectories){
                continue;
            }

            // Intersection with NorthEast secondary cell
            $secondaryCell = $secondaryGrid[$rowIdx][$colIdx];
            /* @var $secondaryCell GridCell */

            if(count($secondaryCell->crossingTrajectoryIds) == $numberOfTrajectories){
                $overlappingCommonCellsNum++;
                $resultCells[] = array("bounds" => new LatLngBounds(
                        $primaryCell->bounds->northEast,
                        $secondaryCell->bounds->southWest
                        ), "info" => "row, col");
            }
            else{
                //$distinctCommonCellsNum++;
            }

            // Intersection with SouthWest secondary cell
            $secondaryCell = $secondaryGrid[$rowIdx+1][$colIdx+1];
            if(count($secondaryCell->crossingTrajectoryIds) == $numberOfTrajectories){
                $overlappingCommonCellsNum++;
                $resultCells[] = array("bounds" => new LatLngBounds(
                        $secondaryCell->bounds->northEast,
                        $primaryCell->bounds->southWest
                        ), "info" => "row+1, col+1");
            }
            else{
                //$distinctCommonCellsNum++;
            }

            // Intersection with SouthEast secondary cell
            $secondaryCell = $secondaryGrid[$rowIdx+1][$colIdx];
            if(count($secondaryCell->crossingTrajectoryIds) == $numberOfTrajectories){
                $overlappingCommonCellsNum++;
                $resultCells[] = array("bounds" => new LatLngBounds(
                        // northEast
                        new LatLng(
                                $secondaryCell->bounds->northEast->lat,
                                $primaryCell->bounds->northEast->lng

                                ),
                        // southWest
                        new LatLng(
                                $primaryCell->bounds->southWest->lat,
                                $secondaryCell->bounds->southWest->lng
                                )
                        ), "info" => "row+1, col\n");
            }
            else{
                //$distinctCommonCellsNum++;
            }

            // Intersection with NorthWest secondary cell
            $secondaryCell = $secondaryGrid[$rowIdx][$colIdx+1];
            if(count($secondaryCell->crossingTrajectoryIds) == $numberOfTrajectories){
                $overlappingCommonCellsNum++;
                $resultCells[] = array("bounds" => new LatLngBounds(
                        // northEast

                        new LatLng(
                                $primaryCell->bounds->northEast->lat,
                                $secondaryCell->bounds->northEast->lng

                                ),
                        new LatLng(
                                $secondaryCell->bounds->southWest->lat,
                                $primaryCell->bounds->southWest->lng
                                )
                        ), "info" => "row, col+1\n NE: primaryNElat, secNElon\n SW: secSWlat, primarySWlon");
            }
            else{
               // $distinctCommonCellsNum++;
            }

        }
    }

    // calculate number of all small cells that contain at least one trajectory into $distinctCommonCellsNum
    // loop all cells of $primaryGrid and check all 4 sub-cells
    $distinctCommonCellsNum = 0;
    for($rowIdx=0 ; $rowIdx < count($primaryGrid) ; $rowIdx++){
        for($colIdx=0 ; $colIdx < count($primaryGrid[0]) ; $colIdx++){

            $primaryCell = $primaryGrid[$rowIdx][$colIdx];

            // NorthEast corner
            $secondaryCell = $secondaryGrid[$rowIdx][$colIdx];
            if(count($primaryCell->crossingTrajectoryIds) > 0 && count($secondaryCell->crossingTrajectoryIds) > 0){
                $distinctCommonCellsNum++;
            }

            // SouthEast corner
            $secondaryCell = $secondaryGrid[$rowIdx+1][$colIdx];
            if(count($primaryCell->crossingTrajectoryIds) > 0 && count($secondaryCell->crossingTrajectoryIds) > 0){
                $distinctCommonCellsNum++;
            }

            // SouthWest corner
            $secondaryCell = $secondaryGrid[$rowIdx+1][$colIdx+1];
            if(count($primaryCell->crossingTrajectoryIds) > 0 && count($secondaryCell->crossingTrajectoryIds) > 0){
                $distinctCommonCellsNum++;
            }

            // NorthWest corner
            $secondaryCell = $secondaryGrid[$rowIdx][$colIdx+1];
            if(count($primaryCell->crossingTrajectoryIds) > 0 && count($secondaryCell->crossingTrajectoryIds) > 0){
                $distinctCommonCellsNum++;
            }
        }
    }

    return $resultCells;
}



function markCellsOfRoute(&$grid, LatLng $startPoint, LatLng $endPoint, $trajectoryId, &$result, $isPrimary){
    $dir = getDirectionTowards($startPoint, $endPoint, $isPrimary);


    // <editor-fold defaultstate="collapsed" desc="Trivial cases">
    if($dir == DIR_S){
        if($isPrimary){
            for($i = ($startPoint->gridCellCoordsPrimary[0]+1) ; $i < $endPoint->gridCellCoordsPrimary[0] ; $i++){
                $grid[$i][$startPoint->gridCellCoordsPrimary[1]]->addToCrossing($trajectoryId);
            }
        }
        else{
            for($i = ($startPoint->gridCellCoordsSecondary[0]+1) ; $i < $endPoint->gridCellCoordsSecondary[0] ; $i++){
                $grid[$i][$startPoint->gridCellCoordsSecondary[1]]->addToCrossing($trajectoryId);
            }
        }
        return;
    }
    if($dir == DIR_N){
        if($isPrimary){
            for($i = ($endPoint->gridCellCoordsPrimary[0]+1) ; $i < $startPoint->gridCellCoordsPrimary[0] ; $i++){
                $grid[$i][$startPoint->gridCellCoordsPrimary[1]]->addToCrossing($trajectoryId);
            }
        }
        else{
            for($i = ($endPoint->gridCellCoordsSecondary[0]+1) ; $i < $startPoint->gridCellCoordsSecondary[0] ; $i++){
                $grid[$i][$startPoint->gridCellCoordsSecondary[1]]->addToCrossing($trajectoryId);
            }
        }

        return;
    }
    if($dir == DIR_W){
        if($isPrimary){
            for($i = ($startPoint->gridCellCoordsPrimary[1]+1) ; $i < $endPoint->gridCellCoordsPrimary[1] ; $i++){
                $grid[$startPoint->gridCellCoordsPrimary[0]][$i]->addToCrossing($trajectoryId);
            }
        }
        else{
            for($i = ($startPoint->gridCellCoordsSecondary[1]+1) ; $i < $endPoint->gridCellCoordsSecondary[1] ; $i++){
                $grid[$startPoint->gridCellCoordsSecondary[0]][$i]->addToCrossing($trajectoryId);
            }
        }

        return;
    }
    if($dir == DIR_E){
        if($isPrimary){
            for($i = ($endPoint->gridCellCoordsPrimary[1]+1) ; $i < $startPoint->gridCellCoordsPrimary[1] ; $i++){
                $grid[$startPoint->gridCellCoordsPrimary[0]][$i]->addToCrossing($trajectoryId);
            }
        }
        else{
            for($i = ($endPoint->gridCellCoordsSecondary[1]+1) ; $i < $startPoint->gridCellCoordsSecondary[1] ; $i++){
                $grid[$startPoint->gridCellCoordsSecondary[0]][$i]->addToCrossing($trajectoryId);
            }
        }

        return;
    }
    //</editor-fold>

    if($isPrimary){
        $x0 = $startPoint->gridCellCoordsPrimary[0];
        $y0 = $startPoint->gridCellCoordsPrimary[1];
        $x1 = $endPoint->gridCellCoordsPrimary[0];
        $y1 = $endPoint->gridCellCoordsPrimary[1];
    }
    else{
        $x0 = $startPoint->gridCellCoordsSecondary[0];
        $y0 = $startPoint->gridCellCoordsSecondary[1];
        $x1 = $endPoint->gridCellCoordsSecondary[0];
        $y1 = $endPoint->gridCellCoordsSecondary[1];
    }


    $dx = abs($x1 - $x0);
    $dy = abs($y1 - $y0);
    $sx = ($x0 < $x1) ? 1 : -1;
    $sy = ($y0 < $y1) ? 1 : -1;
    $err = $dx - $dy;

    while (true) {
        $grid[$x0][$y0]->addToCrossing($trajectoryId);

        if (($x0 == $x1) && ($y0 == $y1)) {
            break;
        }
        $e2 = 2 * $err;

        if ($e2 > -$dy) {
            $err -= $dy;
            $x0 += $sx;
        }
        if ($e2 < $dx) {
            $err += $dx;
            $y0 += $sy;
        }
    }
}

// directions of the 8 possible neighbors
define("DIR_N", 1);
define("DIR_NE", 2);
define("DIR_E", 3);
define("DIR_SE", 4);
define("DIR_S", 5);
define("DIR_SW", 6);
define("DIR_W", 7);
define("DIR_NW", 8);

function getDirectionTowards(LatLng $startPoint, LatLng $endPoint, $isPrimary){

    if($isPrimary){
        $startRow = $startPoint->gridCellCoordsPrimary[0];
        $startCol = $startPoint->gridCellCoordsPrimary[1];
        $endRow = $endPoint->gridCellCoordsPrimary[0];
        $endCol = $endPoint->gridCellCoordsPrimary[1];
    }
    else{
        $startRow = $startPoint->gridCellCoordsSecondary[0];
        $startCol = $startPoint->gridCellCoordsSecondary[1];
        $endRow = $endPoint->gridCellCoordsSecondary[0];
        $endCol = $endPoint->gridCellCoordsSecondary[1];
    }

    if($startRow == $endRow){
        if($startCol > $endCol){ return DIR_E; }
        else{ return DIR_W; }
    }
    if($startCol == $endCol){
        if($startRow > $endRow){ return DIR_N; }
        else { return DIR_S; }
    }

    if( ($startCol > $endCol) && ($startRow > $endRow)){ return DIR_NE; }
    if( ($startCol > $endCol) && ($startRow < $endRow)){ return DIR_SE; }

    if( ($startCol < $endCol) && ($startRow > $endRow)){ return DIR_NW; }
    if( ($startCol < $endCol) && ($startRow < $endRow)){ return DIR_SW; }

}

function getGridCellIndiciesOfPoint(LatLng $northEastCorner, LatLng $point){

    global $gridCellLatDiff;
    global $gridCellLonDiff;

    $latDiff = $northEastCorner->lat - $point->lat;
    $lonDiff = $northEastCorner->lng - $point->lng;

    return array(floor($latDiff / $gridCellLatDiff), floor($lonDiff / $gridCellLonDiff));
}


function getLatitudeDiff($gridSizeMeters){
    return (($gridSizeMeters/1000)/EARTH_RADIUS_KM) * RAD;
}

function getLongitudeDiff($gridSizeMeters, $latitude){
    return (($gridSizeMeters/1000)/EARTH_RADIUS_KM) * RAD / cos(deg2rad($latitude));
}