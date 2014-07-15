<?php

function readData($filePath, $includeTimestamp=false, $dayTimestamp = false, $cleaned=false){
    $skipRows = 6;
    $result = array();
    
    $handle = fopen("../".$filePath, "r");
    $currentRowIdx = -1;
    
    
    while (($row = fgets($handle, 4096)) !== false) {
        $currentRowIdx++;
        if($currentRowIdx < $skipRows){
            continue;
        }

        $tmp = explode(",", $row);

        if($includeTimestamp){
            if($cleaned){
                $result[] = array($tmp[0], $tmp[1], $tmp[2]);
                continue;
            }
            if($dayTimestamp){
                $result[] = array($tmp[0], $tmp[1], $tmp[6], $tmp[4]);
            }
            else{
                $result[] = array($tmp[0], $tmp[1], $tmp[6]);
            }
        }
        else{
            $result[] = array($tmp[0], $tmp[1]);
        }
        

    }
    fclose($handle);
    return $result;
}