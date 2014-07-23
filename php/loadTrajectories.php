<?php

require_once('./dbConnect.php');
require_once('./classes/Trajectory.class.php');

function loadTrajectories($filePathArr, $loadData = false, $subjectId = null) {
    $trajectoryObjects = array();


    if($subjectId != null){
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
        mysql_query("SET SESSION group_concat_max_len = 1000000;");
        $query = mysql_query($baseQueryString);
        
        while ($row = mysql_fetch_assoc($query)) {
            $trajectory = new Trajectory(
                    $row["id"], $row["subjectId"], $row["filePath"], $row["date"], $row["timespan"], $row["boundingBox"], $row["length"], $row["avgLatitude"]
            );

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
                    $trajectory->points[] = array($latitudes[$i], $longitudes[$i], $times[$i]);
                }
                    
            }

            //echo $trajectory->serialize();
            //exit;

            $trajectoryObjects[] = $trajectory;
        }
        return $trajectoryObjects;
    }
    
    
            

    // load individual trajectories
    $pathOrParts = array();
    foreach ($filePathArr as $path) {
        $pathOrParts[] = "`filePath`='" . $path . "'";
    }
    //echo "SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts); exit;
    //$query = mysql_query("SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts));
    $query = mysql_query("SELECT * FROM `trajectory` WHERE " . implode(" OR ", $pathOrParts) . " ORDER BY `id` DESC");

    while ($row = mysql_fetch_assoc($query)) {
        $trajectory = new Trajectory(
                $row["id"], $row["subjectId"], $row["filePath"], $row["date"], $row["timespan"], $row["boundingBox"], $row["length"], $row["avgLatitude"]
        );

        if ($loadData) {
            $dataQuery = mysql_query("SELECT `latitude`, `longitude`, `time` FROM `trajectory_point` WHERE `trajectoryId`='" . $row["id"] . "' ORDER BY `id`");
            $trajectory->points = array();
            while ($entry = mysql_fetch_array($dataQuery)) {
                $trajectory->points[] = array($entry[0], $entry[1], $entry[2]);
            }
        }

        //echo $trajectory->serialize();
        //exit;

        $trajectoryObjects[] = $trajectory;
    }
    return $trajectoryObjects;
}

/*
echo "<pre>";
print_r(loadTrajectoriesFromDB(array("sampleDataCleaned/000/Trajectory/20090403011657.plt", "sampleDataCleaned/000/Trajectory/20081029092138.plt"), true));
echo "</pre>";
*/