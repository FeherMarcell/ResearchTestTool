<?php

require_once('./classes/Trajectory.class.php');

function loadTrajectories(&$link, $filePathArr, $loadData = false, $subjectId = null) {
    
    $trajectoryObjects = array();
    
    
    if($loadData){
        // load full trajectories from DB in JSON representation
        
        
        if($subjectId !== null){
            // load all trajectories of the given subject
            
            $result = mysqli_query(
                    $link, 
                    "SELECT `json` FROM `trajectoryjson` WHERE `trajectoryId` IN (SELECT `id` FROM `trajectory` WHERE `subjectId`='".$subjectId."')"
                    );
            
        }
        else{
            // load only given trajectorie
            $pathOrParts = array();
            foreach ($filePathArr as $path) {
                $pathOrParts[] = "`filePath`='" . $path . "'";
            }
            $result = mysqli_query(
                    $link, 
                    "SELECT `json` FROM `trajectoryjson` WHERE " . implode(" OR ", $pathOrParts) . " ORDER BY `trajectoryId` DESC"
                    );
            
        }
        
        while($row = $result->fetch_array()){
            $trajectoryObjects[] = Trajectory::fromJson($row[0]);
        }
        
        return $trajectoryObjects;
    }
    
    /* Points data is not needed */

    if($subjectId !== null){
        $baseQueryString = "
        SELECT 
            t.*, 
            GROUP_CONCAT(tp.latitude) AS 'latitudes', 
            GROUP_CONCAT(tp.longitude) AS 'longitudes',
            GROUP_CONCAT(tp.time) AS 'times'
        FROM 
            `trajectory` t, 
            `trajectory_point` tp
        WHERE
            tp.trajectoryId = t.id
            AND 
            t.`subjectId`=".$subjectId."
        GROUP BY
            t.id
            ";
        mysqli_query($link, "SET SESSION group_concat_max_len = 1000000;");
        $result = mysqli_query($link, $baseQueryString, MYSQLI_USE_RESULT);
        
        while ($row = $result->fetch_assoc()) {
            $trajectory = new Trajectory(
                    $row["id"]-0, $row["subjectId"]-0, $row["filePath"], $row["date"], $row["timespan"]-0, $row["boundingBox"], $row["length"]-0, $row["avgLatitude"]-0
            );
            
            /* Data is not needed in this case
            if ($loadData) {
                $latitudes = explode(",", $row["latitudes"]);
                $longitudes = explode(",", $row["longitudes"]);
                $times = explode(",", $row["times"]);
                
                if(count($latitudes) != count($longitudes) || count($longitudes) != count($times)){
                    echo "Number of data mismatch at trajectory " . $row["id"] . "!<br>";
                    echo "Latitudes: " . count($latitudes) ."<br>";
                    echo "Longitudes: " . count($longitudes) ."<br>";
                    echo "Times: " . count($times) ."<br>";
                    return;
                }
                
                $trajectory->points = array();
                for($i=0 ; $i<count($latitudes) ; $i++){
                    $trajectory->points[] = array($latitudes[$i]-0, $longitudes[$i]-0, $times[$i]);
                }
            }
            */
            $trajectoryObjects[] = $trajectory;
        }
        $result->close();
        return $trajectoryObjects;
    }
    
    /* load individual trajectories */
    
    
    $pathOrParts = array();
    foreach ($filePathArr as $path) {
        $pathOrParts[] = "`filePath`='" . $path . "'";
    }
    //echo "SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts); exit;
    //$query = mysql_query("SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts));
    $result = mysqli_query(
            $link, 
            "SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts) . " ORDER BY `id` DESC"
            );

    while ($row = $result->fetch_assoc()) {
        $trajectory = new Trajectory(
                $row["id"], $row["subjectId"], $row["filePath"], $row["date"], $row["timespan"], $row["boundingBox"], $row["length"], $row["avgLatitude"]
        );

        $trajectoryObjects[] = $trajectory;
    }
    $result->close();
    
    /* data is not needed in this case
    if ($loadData) {
        for($i=0 ; $i<count($trajectoryObjects) ; $i++){
            
            $result = mysqli_query($link, "SELECT `latitude`, `longitude`, `time` FROM `trajectory_point` WHERE `trajectoryId`='" . $trajectoryObjects[$i]->id. "' ORDER BY `id`");
            $trajectoryObjects[$i]->points = array();
            while ($entry = $result->fetch_array()) {
                $trajectoryObjects[$i]->points[] = array($entry[0], $entry[1], $entry[2]);
            }
        }
    }
     */
    return $trajectoryObjects;
}



/*
echo "<pre>";
print_r(loadTrajectoriesFromDB(array("sampleDataCleaned/000/Trajectory/20090403011657.plt", "sampleDataCleaned/000/Trajectory/20081029092138.plt"), true));
echo "</pre>";
*/