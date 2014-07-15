<?php



function doAngleFilter($filePath, $minAngle, $data=false){
    $compressedPath = array();
    if($data === false){
        $originalData = readData($filePath);
    }
    else{
        $originalData = $data;
    }
    $compressedPath[] = $originalData[0];
    $startIdx = 0;
    $midIdx = 1;
    for($idx=1 ; $idx < count($originalData)-1 ; $idx++){
        $startPoint = $originalData[$startIdx];
        $midPoint = $originalData[$midIdx];
        $lastPoint = $originalData[($midIdx+1)];
        
        if(pointsEqual($startPoint, $midPoint) || pointsEqual($midPoint, $lastPoint)){
            $midIdx++;
            continue;
        }
        $slope1 = calculateSlope($startPoint, $midPoint);
        $slope2 = calculateSlope($midPoint, $lastPoint);
        $angle = atan(abs( ($slope2 - $slope1) / (1 + ($slope1 * $slope2))) ) * 180.0 / pi();
        if($angle >= $minAngle){
            $compressedPath[] = $midPoint;
            $startIdx = $midIdx;
        }
        
        $midIdx++;
    }
    $compressedPath[] = $originalData[count($originalData)-1];
    
    return $compressedPath;
}

function calculateSlope($start, $end){
    return ($end[0] === $start[0]) ? 99999999 : (($end[1] - $start[1]) / ($end[0] - $start[0]));
}
function pointsEqual($p1, $p2){
    if($p1[0] == $p2[0] && $p1[1] == $p2[1]){
        return true;
    }
    return false;
}
