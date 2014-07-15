<?php

require_once './fileReader.php';

function cleanFolder($folderName){
    
    $files = scandir("../sampleData/" . $folderName . "/Trajectory");
    if(!is_array($files)){
        echo "Folder " . $folderName . " is empty";
        return;
    }
    // cut first 2 elements of array ("." and "..")
    $files = array_splice($files, 2, count($files)-2);
    //echo json_encode($files); return;
    
    require_once './angleFilter.php';
    require_once './douglasPeuckerFilter.php';
    
    @mkdir("../sampleDataCleaned/" . $folderName);
    @mkdir("../sampleDataCleaned/" . $folderName . "/Trajectory");
    
    foreach($files as $file){
        $data = readData("sampleData/" . $folderName . "/Trajectory/" . $file, true, FALSE);
        //echo "<pre>".print_r($data, true)."</pre>"; return;
        
        // angle filter
        $data = doAngleFilter(null, 15, $data);
        
        // DP filter
        $tmp = douglasPeuckerFilter($data, 30);
        $data = $tmp["data"];
        $dataString = array();
        foreach($data as $item){
            $dataString[] = implode(",", $item);
        }
        
        //echo "<pre>".print_r($dataString, true)."</pre>"; return;
        
        // start writing the file
        // first 6 lines empty
        for($i=0 ; $i<6 ; $i++){ file_put_contents("../sampleDataCleaned/" . $folderName . "/Trajectory/" . $file, "\n", FILE_APPEND); }
        file_put_contents("../sampleDataCleaned/" . $folderName . "/Trajectory/" . $file, implode("", $dataString) , FILE_APPEND);
        
    }
    
    echo $folderName . " ready";
    
    //echo json_encode($data);
    
}