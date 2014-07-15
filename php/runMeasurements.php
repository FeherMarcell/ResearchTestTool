<?php

require_once './dbConnect.php';
require_once 'fileReader.php';

// read next measurement data
$query = mysql_query("SELECT * FROM `measurementconfigurations` LIMIT 1");
if(mysql_num_rows($query) == 0){
    exit;
}

$result = array(
    "dataFilePath" => "",
    "originalSize" => "",
    "onlyDpCompressedSize" => "",
    "afterAngleCompressedSize" => "",
    "combinedCompressedSize" => "",
    "onlyDpRuntimeMS" => "",
    "combinedRuntimeMS" => "",
    "peakMemoryDP" => "",
    "peakMemoryCombined" => ""
);

$currentConfig = mysql_fetch_assoc($query);
//print_r($currentConfig);

$result["dataFilePath"] = $currentConfig["filePath"];
// load data
$trajectoryData = readData($currentConfig["filePath"]);
$result["originalSize"] = count($trajectoryData);

// load scripts
require_once './douglasPeuckerFilter.php';


if($currentConfig["measurementType"] === "dp"){
    // start time measurement
    $startTime = getTimeMS();


    /* ***********************
     * DP ONLY
     *********************** */
    $dpResult = douglasPeuckerFilter($trajectoryData, $currentConfig["maxDistance"]);
    $result["peakMemoryDP"] = memory_get_peak_usage();
    // measure time
    $result["onlyDpRuntimeMS"] = getTimeMS() - $startTime;
    $result["onlyDpCompressedSize"] = count($dpResult["data"]);
    
    mysql_query("INSERT INTO `measurements` (`dataFilePath`, `originalSize`, `onlyDpCompressedSize`, `onlyDpRuntimeMS`, `peakMemoryDP`, `onyDpMaxStackSize`, `onlyDpDistanceCalculationsNum`) "
            ."VALUES ('".$result["dataFilePath"]."', '".$result["originalSize"]."', '".$result["onlyDpCompressedSize"]."', '".$result["onlyDpRuntimeMS"]."', '".$result["peakMemoryDP"]."', '".$dpResult["maxStackSize"]."', '".$dpResult["distanceCalculationsNum"]."')");
    $id = mysql_insert_id();
    
    // delete test case
    mysql_query("DELETE FROM `measurementconfigurations` WHERE `id`='".$currentConfig["id"]."'");
    
    // call myself async
    curl_post_async("http://localhost/ResearchTestTool/php/runMeasurements.php", array("measurementId" => $id));
    exit;
}




if($currentConfig["measurementType"] === "combined"){
    
    require_once './angleFilter.php';
    
    /* ***********************
     * COMBINED MEASUREMENT
     *********************** */
    // reset clock
    $startTime = getTimeMS();
    // run angle filter first
    $afterAngle = doAngleFilter(null, $currentConfig["minAngle"], $trajectoryData);
    $result["afterAngleCompressedSize"] = count($afterAngle);

    // run DP
    $dpResult = douglasPeuckerFilter($afterAngle, $currentConfig["maxDistance"]);
    $result["peakMemoryCombined"] = memory_get_peak_usage();

    $result["combinedRuntimeMS"] = getTimeMS() - $startTime;
    $result["combinedCompressedSize"] = count($dpResult["data"]);

    // save measurement data
    mysql_query("UPDATE `measurements` SET `afterAngleCompressedSize`='".$result["afterAngleCompressedSize"]."', `peakMemoryCombined`='".$result["peakMemoryCombined"]."', `combinedRuntimeMS`='".$result["combinedRuntimeMS"]."', `combinedCompressedSize`='".$result["combinedCompressedSize"]."', `combinedMaxStackSize`='".$dpResult["maxStackSize"]."', `combinedDistanceCalculationsNum`='".$dpResult["distanceCalculationsNum"]."' WHERE `id`='".$_POST["measurementId"]."'");

    // delete test case
    mysql_query("DELETE FROM `measurementconfigurations` WHERE `id`='".$currentConfig["id"]."'");

    // call myself async
    curl_post_async("http://localhost/ResearchTestTool/php/runMeasurements.php", array());
    
    // finish
    exit;
}




function getTimeMS(){
    return round(microtime(true)*1000);
}

function curl_post_async($url, $params)
{
    $post_params = array();
    foreach ($params as $key => &$val) {
      if (is_array($val)) $val = implode(',', $val);
        $post_params[] = $key.'='.urlencode($val);
    }
    $post_string = implode('&', $post_params);

    $parts = parse_url($url);

    $fp = fsockopen($parts['host'],
        isset($parts['port'])?$parts['port']:80,
        $errno, $errstr, 30);

    $out = "POST ".$parts['path']." HTTP/1.1\r\n";
    $out.= "Host: ".$parts['host']."\r\n";
    $out.= "Content-Type: application/x-www-form-urlencoded\r\n";
    $out.= "Content-Length: ".strlen($post_string)."\r\n";
    $out.= "Connection: Close\r\n\r\n";
    if (isset($post_string)) $out.= $post_string;

    fwrite($fp, $out);
    fclose($fp);
}