<?php

//require_once './getGrid.php';


kMedoids(array(1, 2, 3, 4, 5, 6), 3);

function getDistanceOfPair($a, $b, $c) {
    return $a * $a + $b * $b;
}

function kMedoids($data, $numberOfClusters) {
    echo "<pre>";
    
    $origData = $data;
    echo "Input data: " . implode(", ", $data)."<br/>";

    
    // size of the grid which is used for distance calculations (using double-mesh method)
    $gridSize = 500; // meters
    // this associative array will hold the assignments of trajectories to medoids
    // in [trajectoryIndex] => [medoid index] format
    $assignments = array();

    /* STEP 1 */
    /* Randomly select 'numberOfClusters' of the original set to be the initial medoids */
    $initialMedoids = extractElements($data, $numberOfClusters);
    echo "Initial medoids:\n" . implode(", ", $initialMedoids);

    /* STEP 2 */
    /* Assign each trajectory to the closest medoid */

    // loop trajectories
    for ($dataPointIdx = 0; $dataPointIdx < count($data); $dataPointIdx++) {
        // initialize minimal distance
        $minDistance = null;
        // loop medoids
        for ($medoidIndex = 0; $medoidIndex < count($initialMedoids); $medoidIndex++) {

            // calculate distance of current medoid to current trajectory
            $currentDistance = getDistanceOfPair(
                    $initialMedoids[$medoidIndex], $data[$dataPointIdx], $gridSize
            );

            // if this distance is smaller than the previously found minimal distance,
            // assign current trajectory to current medoid
            // ($minDistance === null is for the first run)
            if ($minDistance === null || $currentDistance < $minDistance) {
                $minDistance = $currentDistance;
                // administer the assignment
                $assignments[$data[$dataPointIdx]] = $medoidIndex;
            }
        }
    } // end of Step 2

    echo "<br>Assignments: <br><pre>";
    print_r($assignments);
    echo "</pre>";

    echo "</pre>";
}

function extractElements(&$originalArr, $howMany) {
    $elements = array();
    for ($i = 0; $i < $howMany; $i++) {
        $deleted = array_splice($originalArr, rand(0, count($originalArr) - 1), 1);
        $elements[] = $deleted[0];
    }
    return $elements;
}

function getRandomSubarray($arr, $howMany) {
    $indicies = array();
    $result = array();
    $lastIndex = count($arr) - 1;
    for ($i = 0; $i < $howMany; $i++) {
        ;
        while (in_array($rand = rand(0, $lastIndex), $indicies)) {
            
        }
        // add value of current index to result array
        $result[] = $arr[$rand];
        $indicies[] = $rand;
    }
    return $result;
}
