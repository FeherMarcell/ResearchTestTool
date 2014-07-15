<?php

/*
$filePath = "sampleData/041/Trajectory/20090709012841.plt";
$maxDeviationMeters = 50;
require_once './fileReader.php';
$trajectoryData = readData($filePath);
*/


function douglasPeuckerFilter($originalTrajectory, $maxDeviationMeters){
    
    $tolerance = getDegreeDiffAtLatitude($maxDeviationMeters, getMaxLatitude($originalTrajectory));
    
    $distanceCalculationsNum = 0;
    
    // start iterative DP
    
    /* 1 */
    $Q = array();
    
    /* 2 */
    $S = array();
    
    /* 3 */
    $v = $originalTrajectory;
    
    /* 4 */
    $anchorIdx = 0;
    $anchor = $v[$anchorIdx];
    
    /* 5 */
    $floaterIdx = count($v)-1;
    $floater = $v[$floaterIdx];
    
    $farthestIdx = 0;
    
    /* 6 */
    $Q[] = $anchor;
    
    /* 7 */
    array_unshift($S, array($floaterIdx, $floater));
    $maxStackSize = 1;
    /* 8 */
    while(count($S) > 0){
        /* 9: let seq be a line seqment from anchor to floater */
        $seq = array($anchor, $floater);
        /* 10 */
        $maxd = 0.0;
        
        /* 11 */
        $farthest = $floater;
        $farthestIdx = $floaterIdx;
        
        /* 13 */
        $i = $anchorIdx + 1;
        
        /* 14 */
        while($i < $floaterIdx){
            /* 15 */
            $d = getOrthogonalDistance($v[$i], $seq[0], $seq[1]);
            $distanceCalculationsNum++;
            
            /* 16 */
            if($d > $maxd){
                /* 17 */
                $maxd = $d;
                
                /* 18 */
                $farthest = $v[$i];
                $farthestIdx = $i;
            }
            /* 19 */
            $i++;
        }
        
        /* 20 */
        if($maxd <= $tolerance){
            /* 21 */
            $tmp = array_shift($S);
            $Q[] = $tmp[1];
            
            /* 22 */
            $anchor = $floater;
            $anchorIdx = $floaterIdx;
            
            /* 23 */
            if(count($S) > 0){
                $floater = $S[0][1];
                $floaterIdx = $S[0][0];
            }
            
        }
        /* 24 */
        else{
            /* 25 */
            $floater = $farthest;
            $floaterIdx = $farthestIdx;
            
            /* 26 */
            array_unshift($S, array($floaterIdx, $floater));
            if(count($S) > $maxStackSize){
                $maxStackSize = count($S);
            }
        }
    }
    /* 27 */
    return array("data" => $Q, "maxStackSize" => $maxStackSize, "distanceCalculationsNum"=>$distanceCalculationsNum);
}

function getOrthogonalDistance($point, $lineStart, $lineEnd){
    $Dp = $lineStart[0] - $lineEnd[0];
    $Dq = $lineStart[1] - $lineEnd[1];
    return abs(1.0*$Dq*$point[0] - 1.0*$Dp*$point[1] + 1.0*$lineStart[0]*$lineEnd[1] - 1.0*$lineStart[1]*$lineEnd[0]) / sqrt($Dp*$Dp + $Dq*$Dq);
}

function getMaxLatitude($data){
    $maxLat = 0.0;
    foreach($data as $point){
        if($point[0] > $maxLat){
            $maxLat = $point[0];
        }
    }
    return $maxLat;
}

function getDegreeDiffAtLatitude($meterDiff, $latitude){
    return $meterDiff/(cos(toRad($latitude)) * 111194.9266);
}

function toRad($deg){
    return $deg * pi() / 180.0;
}
