<?php


$trajectoryFilePaths = listFilesOfFolder("004", "sampleData");

require_once 'fileReader.php';

$trajectory = $trajectoryFilePaths[rand(0, count($trajectoryFilePaths)-1)];
$data = readData($trajectory);

$result = array();

$result["type"] = "Feature";
$result["geometry"] = array("type" => "LineString");
$result["geometry"]["coordinates"] = array();
foreach ($data as $item) {
   $result["geometry"]["coordinates"][] = array($item[0]-0, $item[1]-0);
}

echo json_encode($result);



function listFilesOfFolder($folder, $rootDir){
    $result = array();
    if($folder != "." && $folder != ".."){
        $files = scandir("../".$rootDir."/".$folder."/Trajectory");
        foreach ($files as $file) {
            if(strpos($file, ".plt") >= 0){
                $result[] = $rootDir."/".$folder."/Trajectory/".$file;
            }
        }
    }
    return $result;
}
