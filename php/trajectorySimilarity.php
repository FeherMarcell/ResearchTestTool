<?php

require_once './classes/Trajectory.class.php';

// defines for indexing latitude/longitude values of location arrays
define("LAT", 0);
define("LNG", 1);
// defines for indexing NorthEast and SouthWest coordinates of a BoundingBox array
define("BB_NE", 0);
define("BB_SW", 1);
// defines for conversion between meters and lat/lon differences
define("EARTH_RADIUS_M", 6378000);
define("RAD", (180.0/pi()));
// defines for grid array keys
define("ROW", 0);
define("COL", 1);

function getTrajectorySimilarity($trajectoryObjects, $gridSizeMeters=500, $loggingEnabled = false) {
    if($loggingEnabled) logToFile("getTrajectorySimilarity started");
    /*
    // echo "<pre>";
    for($i=0 ; $i<count($trajectoryObjects) ; $i++){
        var_dump($trajectoryObjects[$i]); // echo "<hr/>";
    }
    */

    $commonBoundingBox = $trajectoryObjects[0]->boundingBox;

    // 1: Check if stretched bounding boxes have an overlapping area with positive size
    if(count($trajectoryObjects) > 1){
        $stretchedBoxes = getStretchedBoundingBoxes($trajectoryObjects, $gridSizeMeters);
        if(!areOverlapping($stretchedBoxes)){
            // no overlapping, similarity is zero
            return 0;
        }
        // calculate the common (strict) bounding box, start from the 2nd
        for($i=1 ; $i<count($trajectoryObjects) ; $i++){
            expandBoundingBox($commonBoundingBox, $trajectoryObjects[$i]->boundingBox);
        }
    }






    /*
     * Calculate size of a grid cell in latitude and longitude diffs
     * the cells are square shaped, both lengths are $gridSize in meters
     * however the lengths are different values in latitude diff and longitude diff (since Earth is not a plane)
     */
    // calculate average of average latitudes
    $avgAvgLatitude = 0;
    for($i=0 ; $i < count($trajectoryObjects) ; $i++){
        $avgAvgLatitude += $trajectoryObjects[$i]->avgLatitude;
    }
    $avgAvgLatitude /= count($trajectoryObjects);
    // actual values of side length of a single cell in latitude and longitude directions
    $gridCellLat = getLatitudeDiff($gridSizeMeters);
    $gridCellLon = getLongitudeDiff($gridCellLat, $avgAvgLatitude);
    $gridCellSize = array(
        LAT => $gridCellLat,
        LNG => $gridCellLon
    );

    // echo "Grid cell size: height: $gridCellLat, width: $gridCellLon<br>";

    $mergedGrids = array();
    $maxColIdx = 0;

    
    
    // 3: For each trajectory, translate the original lat/lng points to double mesh coordinates
    for ($trIdx = 0 ; $trIdx < count($trajectoryObjects) ; $trIdx++) {
        $trajectory = $trajectoryObjects[$trIdx];
        // echo "<hr><hr>Starting trajectory with ".count($trajectory->points)." points<hr>";
        
        /* @var $trajectory Trajectory */

        // loop consecutive pairs of points (edges),
        // calculate the main grid coordinates


        /*
         * Variable $mainGridCells holds the coordinate indicies in [ROW,COL] format of the
         * MainGrid which are crossed by $trajectory edges
         * For example if the grid size is 4x3, an example of coordinate indicied might be:
         * [
         *  [0,1]
         *  [1,1]
         *  [1,2]
         *  [2,2]
         *  [3,2]
         * ]
         *
         * For fast search, we introduce another level into the array, that acts as the bucket in HashMaps.
         * It is always the ROW coordinate of the cells and COLs are listed after it.
         * The same indicies in this form looks like the following:
         * [
         *  0 => [1]
         *  1 => [1,2]
         *  2 => [2]
         *  3 => [2]
         * ]
         */


        $mainGridCells = markTrajectory($trajectory, $gridCellSize, $commonBoundingBox[BB_SW]);
        
        if($loggingEnabled){
            logToFile("Main grid:");
            foreach($mainGridCells as $key => $arr){
                logToFile($key . " => [" . implode(", ", $arr) . "]");
            }
        }
        
        // Secondary grid, shifted
        $secondaryGridSouthWest = array(
            LNG => $commonBoundingBox[BB_SW][LNG] - ($gridCellSize[LNG] / 2),
            LAT => $commonBoundingBox[BB_SW][LAT] - ($gridCellSize[LAT] / 2)
        );
        $secondaryGridCells = markTrajectory($trajectory, $gridCellSize, $secondaryGridSouthWest);
        
        if($loggingEnabled){
            logToFile("Secondary grid:");
            foreach($secondaryGridCells as $key => $arr){
                logToFile($key . " => [" . implode(", ", $arr) . "]");
            }
        }
        
        
        
        
        if($loggingEnabled) logToFile("Merging...");
        // merge two grids to get the overlap
        $mergedGrid = array();
        foreach($mainGridCells as $row => $colArr){
            foreach($colArr as $col){
                if($loggingEnabled) logToFile(" Checking [$row][$col]");
                
                $localMaxCol = -1;

                // $mainCell = [$row, $col];
                // check secondary cells: ($row, $col), ($row+1, $col), ($row, $col+1), ($row+1, $col+1)
                if(isPointInGrid($secondaryGridCells, $row, $col)){
                    addToGrid($mergedGrid, $row + $row, $col + $col);
                    $localMaxCol = $col + $col;
                }
                if(isPointInGrid($secondaryGridCells, $row+1, $col)){
                    addToGrid($mergedGrid, $row+1 + $row, $col + $col);
                    $localMaxCol = $col + $col;
                }
                if(isPointInGrid($secondaryGridCells, $row, $col+1)){
                    addToGrid($mergedGrid, $row + $row, $col + $col+1);
                    $localMaxCol = $col + $col + 1;
                }
                if(isPointInGrid($secondaryGridCells, $row+1, $col+1)){
                    addToGrid($mergedGrid, $row+1 + $row, $col + $col+1);
                    $localMaxCol = $col + $col + 1;
                }

                // keeping track of the maximum column index of merged Grid
                if($localMaxCol > 0 && $localMaxCol > $maxColIdx){
                    $maxColIdx = $localMaxCol;
                }
            }
        }
        if($loggingEnabled) logToFile("Merging finished.");
        
        

        if($loggingEnabled){
            logToFile("Secondary grid:");
            foreach($mergedGrid as $key => $arr){
                logToFile($key . " => [" . implode(", ", $arr) . "]");
            }
        }
        
        
        // add to mergedGrids
        $mergedGrids[] = $mergedGrid;
    }
    

    // check merged grids,
    // count number of all unique cells / number of cells where all trajectories are present


    //// echo "<pre>\n".print_r($mergedGrids, true)."</pre><br>";
    // echo "Merged grid keys: " . implode(", ", array_keys($mergedGrids))."<br>";

    // calculate max row
    $maxRowId = -1;
    foreach($mergedGrids as $mergedGrid){
        $localMax = max(array_keys($mergedGrid));
        if($localMax > $maxRowId){
            $maxRowId = $localMax;
        }
    }

    // echo "Max row: " . $maxRowId."<br>";
    // echo "Max col: " . $maxColIdx."<br>";
    $numGrids = count($mergedGrids);
    $overlappingMergedCellsNum = 0;
    $distinctMergedCellsNum = 0;

    $overlappingCells = array();

    for($row = 0 ; $row <= $maxRowId ; $row++){
        for($col = 0 ; $col <= $maxColIdx ; $col++){
            // check all merged grids, count that in how many ($row, $col) is present
            $tmp = findCellInGrids($mergedGrids, $row, $col);
            // if the current cell is present in at least one grid, increase the number of unique cells
            if($tmp > 0){
                $distinctMergedCellsNum++;
            }
            if($tmp == $numGrids){
                // if all trajectores go through the current cell, increase the number of overlapping cells
                $overlappingMergedCellsNum++;
                // add cell to overlapping common cells (for further use)
                $overlappingCells[] = array(ROW => $row, COL => $col);
            }
        }
    }
    // echo "Overlapping cells: <br><pre>".print_r($overlappingCells, true)."</pre><hr>";


    // echo "Unique cells: " . $distinctMergedCellsNum."<br>";
    // echo "Overlapping cells: " . $overlappingMergedCellsNum."<br>";

    if($distinctMergedCellsNum == 0){
        $similarity = 0;
    }
    else{
        $similarity = ($overlappingMergedCellsNum / $distinctMergedCellsNum);
    }
    
    if($loggingEnabled) logToFile("Calculated similarity: " . $similarity);
    if($loggingEnabled) logToFile("getTrajectorySimilarity finished");
    
    return $similarity;

    //return array("MainGrid" => $mainGridCells, "SecondaryGrid" => $secondaryGridCells, "MergedGrid" => $mergedGrid);
}



function findCellInGrids(&$gridsArr, $row, $col){
    $counter = 0;
    foreach($gridsArr as $grid){
        if(isPointInGrid($grid, $row, $col)){
            $counter++;
        }
    }
    return $counter;
}

function isPointInGrid(&$grid, $row, $col){
    return in_array($row, array_keys($grid)) && in_array($col, $grid[$row]);
}

function markTrajectory(&$trajectory, $gridCellSize, $gridSouthWest){
        /* @var $trajectory Trajectory */

        // logToFile("markTrajectory called for trajectory " . $trajectory->id);
    
        $gridCells = array();

        // calculate cell of the very first point
        $edgeStartPoint = $trajectory->points[0];
        $edgeStartCoords = calculateGridCoordOfPoint($gridSouthWest, $gridCellSize, $edgeStartPoint);
        
        // and mark it in $gridCells
        addToGrid($gridCells, $edgeStartCoords[ROW], $edgeStartCoords[COL]);
        for($i=1 ; $i<count($trajectory->points) ; $i++){
            // logToFile("marking edge between points " . ($i-1) . " and " . $i);
            $edgeEndPoint = $trajectory->points[$i];
            $edgeEndCoords = calculateGridCoordOfPoint($gridSouthWest, $gridCellSize, $edgeEndPoint);
            
            if($edgeEndCoords[ROW] == $edgeStartCoords[ROW] && $edgeEndCoords[COL] == $edgeStartCoords[COL]){
                // both ends of the edge are at the same cell of the grid, do nothing!
                // echo "<br>same cell";
            }
            else if(inNeighbourCells($edgeStartCoords, $edgeEndCoords)){
                // echo "<br>neighbor cell";
                // they are in neighbour cells, add edge end coords to $mainGridCells
                addToGrid($gridCells, $edgeEndCoords[ROW], $edgeEndCoords[COL]);
            }
            else if($edgeStartCoords[ROW] == $edgeEndCoords[ROW]){
                // horizontal line
                // echo "<br>horizontal line";
                $increment = ($edgeStartCoords[COL] < $edgeEndCoords[COL]) ? +1 : -1;
                for($edgeStartCoords[COL] ; $edgeStartCoords[COL] <= $edgeEndCoords[COL] ; $edgeStartCoords[COL] += $increment){
                    addToGrid($gridCells, $edgeStartCoords[ROW], $edgeStartCoords[COL]);
                }
            }
            else if($edgeStartCoords[COL] == $edgeEndCoords[COL]){
                // vertical line
                // echo "<br>vertical line";
                
                $increment = ($edgeStartCoords[ROW] < $edgeEndCoords[ROW]) ? 1 : -1;
                for($edgeStartCoords[ROW] ; $edgeStartCoords[ROW] <= $edgeEndCoords[ROW] ; $edgeStartCoords[ROW] += $increment){
                    addToGrid($gridCells, $edgeStartCoords[ROW], $edgeStartCoords[COL]);
                }
            }
            else{
                // they are neither in the same, nor in neighbouring cells, it's a skew line
                // echo "skew line<br/>";
                // also all grid cells between these point must be added too
                
                markCellsOfLine($gridCells, $edgeStartPoint, $edgeEndPoint, $edgeStartCoords, $edgeEndCoords, $gridCellSize, $gridSouthWest);
                
            }
            
            // at the next loop, the start will be the point which is edgeEnd now
            $edgeStartCoords = $edgeEndCoords;
            $edgeStartPoint = $edgeEndPoint;
            
        }

        return $gridCells;
}

/**
 * Marks the grid cells which are touched by the straight line $startPoint -> $endPoint.
 * After computing which cels should be marked, this method must use addToGrid() method to actually mark the cells!
 *
 * Parameters $startPoint and $endPoint holds the GPS coordinates of the points in [LAT => {latitude}, LNG => {longitude}] format
 * Parameters $startPointCoords and $endPointCoords holds the cell indicies of the same points in [ROW => {rowIndex}, COL => {columnIndex}] format
 * Latter params are provided because it's kinda expensive to calculate them and it's already done so now we don't have to calculate them again
 *
 * @param array $grid Reference to the Grid
 * @param array $startPoint GPS coordinates array of the startPoint
 * @param array $endPoint GPS coordinates array of the endPoint
 * @param array $startPointCoords Cell indicies array of startPoint
 * @param array $endPointCoords Cell indicies array of endPoint
 * @param array $gridCellSize Length of side of a cell (both in latitude and longitude diffs)
 */
function markCellsOfLine(&$grid, $startPoint, $endPoint, $startPointCoords, $endPointCoords, &$gridCellSize, $gridSouthWest){
   // reorder start & endpoint by LAT 
   if($startPoint[LNG] > $endPoint[LNG]){
       // echo "switch<br>";
       $tmp = $startPoint;
       $startPoint = $endPoint;
       $endPoint = $tmp;
       // also flip grid coords
       $tmp = $startPointCoords;
       $startPointCoords = $endPointCoords;
       $endPointCoords = $tmp;
   }
   
   // echo "markCellsOfLine was called - [".$startPointCoords[ROW].",".$startPointCoords[COL]."] -> [".$endPointCoords[ROW].",".$endPointCoords[COL]."]<br/>";
   // echo "markCellsOfLine was called - [".$startPoint[LAT].",".$startPoint[LNG]."] -> [".$endPoint[LAT].",".$endPoint[LNG]."]<br/>";
   
   /*
   http://stackoverflow.com/questions/3233522/elegant-clean-special-case-straight-line-grid-traversal-algorithm

   @inproceedings{amanatides1987fast,
     title={A fast voxel traversal algorithm for ray tracing},
     author={Amanatides, John and Woo, Andrew and others},
     booktitle={Proceedings of EUROGRAPHICS},
     volume={87},
     pages={3--10},
     year={1987}
   }

   1. Given two points A and B, determine the intersection points of the line (A, B) with every vertical line of Your grid, that lies within this interval.
   2. Insert two special intersection points inside the cells containing A and B at the start/end of the list from point 1
   3. Interpret every two sequent intersection points as the min and max vectors of a axis aligned rectangle and mark all grid cells that
      lie inside this rectangle (this is very easy (intersection of two axis aligned rects), especially considering, that the rectangle has a
      width of 1 and therefore occupies only 1 column of Your grid)

           +------+------+------+------+
           |      |      |      |      |
           |      |      | B    *      |
           |      |      |/     |      |
           +------+------*------+------+
           |      |     /|      |      |
           |      |    / |      |      |
           |      |   /  |      |      |
           +------+--/---+------+------+
           |      | /    |      |      |
           |      |/     |      |      |
           |      *      |      |      |
           +-----/+------+------+------+
           |    / |      |      |      |
           *   A  |      |      |      |
           |      |      |      |      |
           +------+------+------+------+

   */
   
   
   $slope = ($endPoint[LAT] - $startPoint[LAT]) / ($endPoint[LNG] - $startPoint[LNG]);
   
   $startXCoord = $startPointCoords[ROW];
   $endXCoord = $endPointCoords[ROW];
   
   $prevYCoord = floor(abs($startPoint[LAT] - $gridSouthWest[LAT]) / $gridCellSize[LAT]);
           
   for($startXCoord ; $startXCoord <= $endXCoord ; $startXCoord++){
       $currentDx = (($startXCoord + 1) * $gridCellSize[LNG]) + $gridSouthWest[LNG] - $startPoint[LNG];
       $y = $startPoint[LAT] + ($slope * $currentDx);
       
       
       if($startXCoord != $endXCoord){
           $currentYCoord = floor(abs($y - $gridSouthWest[LAT]) / $gridCellSize[LAT]);
       }
       else{
           // last run
           $currentYCoord = $endPointCoords[COL];
       }
       
       $cachedCurrentYCoord = $currentYCoord;
       
       // loop and mark cells between prevYCoord and currentYCoord
       $increment = ($currentYCoord <= $prevYCoord) ? 1 : -1;
       for($currentYCoord ; $currentYCoord <= $prevYCoord ; $currentYCoord += $increment){
           addToGrid($grid, $startXCoord, $currentYCoord);
       }
       // set the cached Y coord for the next iteration
       $prevYCoord = $cachedCurrentYCoord;
       
   }
   
}

function addToGrid(&$grid, $row, $col){
    // this is the first element
    if(!in_array($row, array_keys($grid))){
        $grid[$row][] = $col;
        return;
    }
    // check if element is already in the array
    foreach($grid[$row] as $el){
        if($el === $col){
            // found, no need to push it again
            return;
        }
    }
    // otherwise add it to the array
    $grid[$row][] = $col;
}

/**
 * Calculates the coordinates of cell, where a given point is.
 * Note that all paramters are taken as references to avoid copying. These values are not modified.
 *
 * @param array $gridSouthWest SouthWest lat/lng coordinate of the grid (lower left corner)
 * @param array $gridCellSize An array holding the dimensions of a single cell in lat/lng diffs
 * @param array $point The lat/lng coords of the point
 * @return array An array with the relative cell coords
 */
function calculateGridCoordOfPoint(&$gridSouthWest, &$gridCellSize, &$point){
    return array(
        ROW => floor(($point[LNG] - $gridSouthWest[LNG]) / $gridCellSize[LNG]),
        COL => floor(($point[LAT] - $gridSouthWest[LAT]) / $gridCellSize[LAT])
    );
}

/**
 * Returns a new array of bounding boxes of given trajectories, stretched $gridSize/2 to the NE and $gridSize/2 to the SW directions
 *
 * @param type $originalTrajectories The array of original trajectories, untouched
 * @param type $gridSize The grid size in meters
 * @return array A new array of stretched bounding boxes (arrays)
 */
function getStretchedBoundingBoxes(&$originalTrajectories, $gridSize) {
    /* @var $originalTrajectories array(Trajectory)  */
    $stretchedBoxes = array();
    $stretch[LAT] = getLatitudeDiff($gridSize/2);

    for ($i = 0; $i < count($originalTrajectories); $i++) {
        $stretch[LNG] = getLongitudeDiff($gridSize/2, $originalTrajectories[$i]->avgLatitude);

        $stretchedBoxes[] = array(
            BB_NE => array(
                $originalTrajectories[$i]->boundingBox[BB_NE][LAT] + $stretch[LAT],
                $originalTrajectories[$i]->boundingBox[BB_NE][LNG] + $stretch[LNG]
                ),
            BB_SW => array(
                $originalTrajectories[$i]->boundingBox[BB_SW][LAT] - $stretch[LAT],
                $originalTrajectories[$i]->boundingBox[BB_SW][LNG] - $stretch[LNG]
            )
        );

    }
    return $stretchedBoxes;
}

function inNeighbourCells($cellCoord1, $cellCoord2){

    $rowDiff = ($cellCoord1[ROW] > $cellCoord2[ROW]) ? $cellCoord1[ROW] - $cellCoord2[ROW] : $cellCoord2[ROW] - $cellCoord1[ROW];
    $colDiff = ($cellCoord1[COL] > $cellCoord2[COL]) ? $cellCoord1[COL] - $cellCoord2[COL] : $cellCoord2[COL] - $cellCoord1[COL];
    // if one of them is 1 and the other is 0, then they are neighbors
    if($rowDiff + $colDiff == 1){
        return true;
    }
    return false;
}

/**
 * Checks if the given bounding boxes has overlapping region
 *
 * @param type $boundingBoxesArr Array of Bounding Boxes (arrays)
 * @return bool True if there is an overlapping region, false otherwise
 */
function areOverlapping(&$boundingBoxesArr){
    $intersection = $boundingBoxesArr[0];
    $maxBBSize = getBoundingBoxArea($boundingBoxesArr[0]);
    for($i=1 ; $i<count($boundingBoxesArr) ; $i++){
        $currentBBSize = getBoundingBoxArea($boundingBoxesArr[$i]);
        if($currentBBSize > $maxBBSize){
            $maxBBSize = $currentBBSize;
        }
        trimToIntersection($intersection, $boundingBoxesArr[$i]);
    }
    $trimmedArea = getBoundingBoxArea($intersection);
    // if the largest area is at least 10x larger than the intersection, report false
    if($trimmedArea*10 < $maxBBSize){
        return false;
    }
    return (getBoundingBoxArea($intersection) > 0);
}

/**
 * Returns the area of the given bounding box in the lat/lng coordinate system
 *
 * @param array $boundingBox The bounding box
 * @return double The area of the given BB
 */
function getBoundingBoxArea(&$boundingBox){
    $latSpan = $boundingBox[BB_NE][LAT] - $boundingBox[BB_SW][LAT];
    $lonSpan = $boundingBox[BB_NE][LNG] - $boundingBox[BB_SW][LNG];
    return max(0, $latSpan * $lonSpan);
}

/**
 * Trims the first BoundingBox to the second.
 * USE WITH CAUTION! The function takes reference to the first BB to avoid copying arrays!
 * It modifies the ORIGINAL boundingbox array!
 *
 * @param array $intersection
 * @param array $nextBoundingBox
 */
function trimToIntersection(&$intersection, $nextBoundingBox){
    $intersection[BB_NE][LAT] = min($intersection[BB_NE][LAT], $nextBoundingBox[BB_NE][LAT]);
    $intersection[BB_NE][LNG] = min($intersection[BB_NE][LNG], $nextBoundingBox[BB_NE][LNG]);

    $intersection[BB_SW][LAT] = max($intersection[BB_SW][LAT], $nextBoundingBox[BB_SW][LAT]);
    $intersection[BB_SW][LNG] = max($intersection[BB_SW][LNG], $nextBoundingBox[BB_SW][LNG]);
}

function expandBoundingBox(&$firstBoundingBox, $nextBoundingBox){
    $firstBoundingBox[BB_NE][LAT] = max($firstBoundingBox[BB_NE][LAT], $nextBoundingBox[BB_NE][LAT]);
    $firstBoundingBox[BB_NE][LNG] = max($firstBoundingBox[BB_NE][LNG], $nextBoundingBox[BB_NE][LNG]);

    $firstBoundingBox[BB_SW][LAT] = min($firstBoundingBox[BB_SW][LAT], $nextBoundingBox[BB_SW][LAT]);
    $firstBoundingBox[BB_SW][LNG] = min($firstBoundingBox[BB_SW][LNG], $nextBoundingBox[BB_SW][LNG]);
}

function getLatitudeDiff($gridSizeMeters) {
    return (($gridSizeMeters) / EARTH_RADIUS_M) * RAD;
}

function getLongitudeDiff($latitudeDiff, $latitude) {
    return $latitudeDiff / cos(deg2rad($latitude));
}
