<?php

require_once './dbConnect.php';
require_once 'fileReader.php';

$query = mysql_query("SELECT `filePath` from `trajectory` WHERE `timespan`>10000 ORDER BY RAND() LIMIT 1");
$filePath = mysql_result($query, 0, "filePath");
echo json_encode(readData($filePath, true, false, true));
exit;

$trajectoriesFolder = "sampleData";

$result = array();
$trajectoryFilePaths = array();
// read all files to $trajectoryFiles
/*
$folders = scandir("../".$trajectoriesFolder);
foreach ($folders as $folder) {
    $trajectoryFiles = listFilesOfFolder($folder, $trajectoriesFolder);
}
 */

$trajectoryFilePaths = listFilesOfFolder("003", $trajectoriesFolder);



$maxRows = 50;
$currentRows = $maxRows+1;

while($currentRows > $maxRows){
    $trajectory = $trajectoryFilePaths[rand(0, count($trajectoryFilePaths)-1)];
    $result["dataFile"] = $trajectory;
    $result["data"] = readData($trajectory, true);
    $currentRows = count($result["data"]);
}



// calculate MBR
/*
$minLat = 1000;
$minLon = 1000;
$maxLat = -1000;
$maxLon = -1000;

foreach($result["data"] as $point){
    if($point[0] < $minLat){ $minLat = $point[0]; }
    if($point[0] > $maxLat){ $maxLat = $point[0]; }

    if($point[1] < $minLon){ $minLon = $point[1]; }
    if($point[1] > $maxLon){ $maxLon = $point[1]; }
}

$result["MBR"] = array(array($minLat, $maxLon), array($maxLat, $minLon));
*/
echo json_encode($result);

function listFilesOfFolder($folder, $rootDir){
    $result = array();
    if($folder != "." && $folder != ".."){
        $files = scandir("../".$rootDir."/".$folder."/Trajectory");
        foreach ($files as $file) {
            if( $file != "." && $file != ".." && strpos($file, ".plt") >= 0){
                $result[] = $rootDir."/".$folder."/Trajectory/".$file;
            }
        }
    }
    return $result;
}