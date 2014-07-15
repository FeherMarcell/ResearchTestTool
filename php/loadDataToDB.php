<?php

require_once './dbConnect.php';
require_once './fileReader.php';
require_once './classes/LatLngBounds.class.php';
require_once './classes/SimpleLatLon.php';

$trajectoryIds = array();
$trajectoryIdsQuery = mysql_query("SELECT `id` FROM `trajectory` ORDER BY `id`");
while($row = mysql_fetch_assoc($trajectoryIdsQuery)){
    $trajectoryIds[] = $row["id"];
}

echo "<pre>Trajectory IDs: <br>".implode("<br>", $trajectoryIds)."</pre><br>"; exit;

foreach($trajectoryIds as $id){

    $points = [];
    $pointsQuery = mysql_query("SELECT `id`, `latitude`, `longitude`, TIME_TO_SEC(`time`) AS 'seconds', `id` FROM `trajectory_point` WHERE `trajectoryId`='".$id."' ORDER BY `id`");
    while($row = mysql_fetch_assoc($pointsQuery)){
        $points[] = new SimpleLatLon($row['latitude'], $row["longitude"], $row["seconds"], $row["id"]);
    }

    //echo "<pre>";

    $edgeStart = $points[0];
    for($i=1 ; $i< count($points) ; $i++){
        $edgeEnd = $points[$i];

        $dist = $edgeStart->distanceTo($edgeEnd);
        $timeDiff = $edgeEnd->_time - $edgeStart->_time;
        if($timeDiff < 0){
            // first point is on one day, next is after midnight
            $timeDiff = 86400 - $edgeStart->_time + $edgeEnd->_time;
        }
        mysql_query("UPDATE `trajectory_point` SET `distanceFromPrev`='".$dist."', `timeFromPrev`='".$timeDiff."' WHERE `id`='".$edgeEnd->_id."'");

        //echo $edgeEnd . " - distance: " . $dist . " m, timeDiff: " . $timeDiff . "s<br>";

        $edgeStart = $edgeEnd;
    }
//echo "</pre>";
}

echo "done";

exit;

/*
 * Sets the number of points and total timespan of trajectories

// calculate set seconds value of trajectory points
$trajectoryIdsQuery = mysql_query("SELECT `id` FROM `trajectory` ORDER BY `id`");

while($row = mysql_fetch_assoc($trajectoryIdsQuery)){
    $id = $row["id"];
    
    $timeSpanQuery = mysql_query("SELECT COUNT(*) AS 'pointsNum', max(TIME_TO_SEC(`time`)) - min(TIME_TO_SEC(`time`)) AS 'timespan' FROM `trajectory_point` WHERE `trajectoryId` = '".$id."'");
    $pointsNum = mysql_result($timeSpanQuery, 0, "pointsNum");
    $timeSpan = mysql_result($timeSpanQuery, 0, "timespan");
    mysql_query("UPDATE `trajectory` SET `timespan`='".$timeSpan."', `pointsNum`='".$pointsNum."' WHERE `id`='".$id."'");
}
echo "done";
exit;
 * 
 */

$baseFolder = "sampleDataCleaned";

$userFolders = scandir("../".$baseFolder);

//echo "<pre>".print_r($userFolders, true)."</pre>";
$printed = false;
for($i=2 ; $i<count($userFolders) ; $i++){
    $files = listFilesOfFolder($userFolders[$i], $baseFolder);

    foreach($files as $file){
        $trajectory["filePath"] = $file;
        //echo $file."<br>";
        $data = readData($file, true, false, true);
        /*
        if(!$printed){
            echo "<pre>".print_r($data, true)."</pre>";
            $printed = true;
            exit;
        }
        */

        $tmp = explode("/", $file);
        $fileName = substr($tmp[count($tmp)-1], 0, strlen($tmp[count($tmp)-1]-4));
        //echo $fileName."<br>";
        //echo substr($fileName, 0, 4)."-".substr($fileName, 4, 2)."-".substr($fileName, 5, 2); exit;

        $trajectory = array();
        $trajectory["subjectId"] = $userFolders[$i];
        $trajectory["filePath"] = $file;
        $trajectory["date"] = substr($fileName, 0, 4)."-".substr($fileName, 4, 2)."-".substr($fileName, 5, 2);

        // calculate average latitude and bounding box

        $latSum = 0;
        // bounding box coordinates (NorthEast & SouthWest)
        $bbNELat = $data[0][0];
        $bbNELon = $data[0][1];
        $bbSWLat = $data[0][0];
        $bbSWLon = $data[0][1];

        $points = array();
        foreach($data as $point){

            $latSum += $point[0];

            if($point[0] > $bbNELat){ $bbNELat = $point[0]; }
            if($point[1] > $bbNELon){ $bbNELon = $point[1]; }

            if($point[0] < $bbSWLat){ $bbSWLat = $point[0]; }
            if($point[1] < $bbSWLon){ $bbSWLon = $point[1]; }
        }
        $trajectory["avgLatitude"] = $latSum / count($data);
        $trajectory["boundingBox"] = $bbNELat." ".$bbNELon." ".$bbSWLat." ".$bbSWLon;
        $trajectory["timespan"] = -1;
        $trajectory["length"] = -1;

        $query = mysql_query("INSERT INTO `trajectory`(subjectId, `filePath`, `date`, avgLatitude, boundingBox, timespan, length) VALUES ('".$trajectory["subjectId"]."', '".$trajectory["filePath"]."', '".$trajectory["date"]."', '".$trajectory["avgLatitude"]."', '".$trajectory["boundingBox"]."', '".$trajectory["timespan"]."', '".$trajectory["length"]."')");
        $trajectoryId = mysql_result(mysql_query("SELECT MAX(`id`) as 'id' FROM `trajectory`"), 0, 'id');

        $pointsQuery = "INSERT INTO `trajectory_point`(`trajectoryId`, `latitude`, `longitude`, `time`) VALUES ";
        $pointsQueryParts = array();
        foreach($data as $point){
            $pointsQueryParts[] = "('".$trajectoryId."', '".$point[0]."', '".$point[1]."', '".$point[2]."')";
        }
        $pointsQuery .= implode(", ", $pointsQueryParts);
        mysql_query($pointsQuery);
        echo "<p style='color: red'>".mysql_error()."</p>";
        echo $file. " inserted.<br>";



    }
}

/*
$query = mysql_query("SELECT * FROM `geolife_dataset_userfolders`");
while($userFolder = mysql_fetch_assoc($query)){
    $fileQuery = mysql_query("SELECT `id`, `datafile_relative_path` FROM `geolife_dataset_trajectoryfiles` WHERE `geolife_userid`='".$userFolder["id"]."'");
    while($dataFile = mysql_fetch_assoc($fileQuery)){
        $queryString = "INSERT INTO `point`(`trajectory_id`, `index_in_trajectory`, `lat`, `lng`, `time`) VALUES ";
        $queryStringParts = array();
        $data = readData("sampleDataCleaned/".$userFolder["folderName"].$dataFile["datafile_relative_path"], true, false, true);
        for($i=0 ; $i<count($data) ; $i++){
            $queryStringParts[] = "('".$dataFile["id"]."', '".$i."', '".$data[$i][0]."', '".$data[$i][1]."', '".$data[$i][2]."')";
        }
        $queryString .= join(", ", $queryStringParts);
        mysql_query($queryString);
        $err = mysql_error();
        if($err !== ''){
            echo "<p style='color: red'>Error: ".$err."<br/>Query: ".$queryString."</p>";
            exit;
        }
        else{
            echo "<p style='color: green'>".$dataFile["datafile_relative_path"] . " saved</p>";
        }


    }
}
*/

function listFilesOfFolder($folder, $rootDir){
    $result = array();
    if($folder != "." && $folder != ".."){
        $files = scandir("../".$rootDir."/".$folder."/Trajectory");
        foreach ($files as $file) {
            if($file != "." && $file != ".." && strpos($file, ".plt") >= 0){
                $result[] = $rootDir."/".$folder."/Trajectory/".$file;
            }
        }
    }
    return $result;
}