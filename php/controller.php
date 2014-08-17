<?php

require_once 'fileReader.php';
require_once './dbConnect.php';

error_reporting(E_ALL);

switch($_REQUEST["command"]){
    
    case "cacheDistances":

        for($userId=2 ; $userId<30 ; $userId++){
            $gridSizes = array(250, 500, 750);
            foreach($gridSizes as $gridSize){
                logToFile("Calculatig distance matrix for subject #".$userId." with grid size ".$gridSize."meters");
                $now = round(microtime(true) * 1000);
                calculateStoreDistanceMatrix($DB_LINK, $userId, $gridSize);
                $time = (round(microtime(true) * 1000) - $now) / 1000;
                logToFile(" Matrix successfully created and saved in " . $time . " seconds.");
            }
        }
        echo "CacheDistances finished.";
        break;
        
    case "dbscan":

        echo "<pre>";

        $userId = 3;
        if(isset($_REQUEST["userId"]) && $_REQUEST["userId"] != ""){
            $userId = $_REQUEST["userId"];
        }

        $currTime = round(microtime(true) * 1000);

        require_once './loadTrajectories.php';
        $trajectoryObjects = loadTrajectories($DB_LINK, null, true, $userId);

        //echo "Trajectory Objects:<br>" . implode("<br>", $trajectoryObjects);

        //echo "<br><br>";
        logToFile("<b>Loading data took " . (round(microtime(true) * 1000) - $currTime) . "ms</b><br>");
        logToFile("Number of data points: " . count($trajectoryObjects));
        $currTime = round(microtime(true) * 1000);



        require_once './trajectorySimilarity.php';
        require_once './classes/DbScan.class.php';
        $clusters = DbScan::getClusters($trajectoryObjects);

        logToFile("<b>Clustering took " . (round(microtime(true) * 1000) - $currTime) . "ms</b><br>");

        echo("CLUSTERS: <br>");
        foreach($clusters as $idx => $arrayOfTrajectories){
            echo("$idx => [<br>");

            foreach($arrayOfTrajectories as $t){
                echo($t->filePath."<br>");
            }

            echo("<br>]<br><br>");
        }

        echo("</pre>");


        break;

    case "getSimilarity":


        require_once './loadTrajectories.php';
        
        
        if(isset($_REQUEST["trajectory1"]) && isset($_REQUEST["trajectory1"])){
            $trajectoryObjects = loadTrajectories($DB_LINK, 
                    array(
                        $_REQUEST["trajectory1"],
                        $_REQUEST["trajectory2"]),
                    true);
        }
        else{
            $trajectoryObjects = loadTrajectories($DB_LINK,
                array(
                    "sampleDataCleaned/003/Trajectory/20081023175854.plt",
                    "sampleDataCleaned/003/Trajectory/20081213091636.plt"
                    ),
                true);
        }
        
        $gridSize = 500;
        if(isset($_REQUEST["gridSize"])){
            $gridSize = $_REQUEST["gridSize"];
        }
        

        require_once './trajectorySimilarity.php';
        /*

        $testTrajectory = new Trajectory(0, 0, "", '', 0, "0 0 1 1", 0, 0);
        $testTrajectory->points = array(
            array(1.0, 1.2),
            array(0.9255578874228664,1.7193603515625),
            array(0.5, 2.1)
        );

        // calculate average latitude
        $avgLat = 0.0;
        // compute bounding box
        // bounding box coordinates (NorthEast & SouthWest)
        $bbNELat = $testTrajectory->points[0][0];
        $bbNELon = $testTrajectory->points[0][1];
        $bbSWLat = $testTrajectory->points[0][0];
        $bbSWLon = $testTrajectory->points[0][1];

        foreach($testTrajectory->points as $point){
            $avgLat += $point[0];

            if($point[0] > $bbNELat){ $bbNELat = $point[0]; }
            if($point[1] > $bbNELon){ $bbNELon = $point[1]; }

            if($point[0] < $bbSWLat){ $bbSWLat = $point[0]; }
            if($point[1] < $bbSWLon){ $bbSWLon = $point[1]; }
        }
        $avgLat /= count($testTrajectory->points);
        $testTrajectory->avgLatitude = $avgLat;

        $testTrajectory->boundingBox = array(array($bbNELat, $bbNELon), array($bbSWLat, $bbSWLon));
        //echo "Bounding box: \n<pre>".print_r($testTrajectory->boundingBox, true)."</pre><br>";




        $testTrajectory2 = new Trajectory(0, 0, "", '', 0, "0 0 1 1", 0, 0);
        $testTrajectory2->points = array(
            array(1.0, 1.1),
            array(0.5, 2.0)
        );

        // calculate average latitude
        $avgLat = 0.0;
        // compute bounding box
        // bounding box coordinates (NorthEast & SouthWest)
        $bbNELat = $testTrajectory2->points[0][0];
        $bbNELon = $testTrajectory2->points[0][1];

        $bbSWLat = $testTrajectory2->points[0][0];
        $bbSWLon = $testTrajectory2->points[0][1];

        foreach($testTrajectory2->points as $point){
            $avgLat += $point[0];

            if($point[0] > $bbNELat){ $bbNELat = $point[0]; }
            if($point[1] > $bbNELon){ $bbNELon = $point[1]; }

            if($point[0] < $bbSWLat){ $bbSWLat = $point[0]; }
            if($point[1] < $bbSWLon){ $bbSWLon = $point[1]; }
        }
        $avgLat /= count($testTrajectory2->points);
        $testTrajectory2->avgLatitude = $avgLat;

        $testTrajectory2->boundingBox = array(array($bbNELat, $bbNELon), array($bbSWLat, $bbSWLon));
        //echo "Bounding box: \n<pre>".print_r($testTrajectory2->boundingBox, true)."</pre><br>";
        $result = getTrajectorySimilarity(array($testTrajectory, $testTrajectory2), 40000);
        */
        
        $withGrids = false;
        if(isset($_REQUEST["withGrid"]) || in_array("withGrid", array_keys($_REQUEST))){
            $withGrids = true;
        }

        $now = microtime();
        $result = getTrajectorySimilarity($trajectoryObjects, $gridSize, true, $withGrids);
        //echo ((microtime() - $now) *1000) . "ns<br>";
        if(is_array($result)){
            echo json_encode($result);
        }
        else{
            echo $result;
        }
        
        /*
        //sort($result["MainGrid"]);
        echo "Main grid: <br>";
        foreach($result["MainGrid"] as $key => $arr){
            echo $key . " => [" . implode(", ", $arr) . "]<br>";
        }

        //sort($result["SecondaryGrid"]);
        echo "Secondary grid: <br>";
        foreach($result["SecondaryGrid"] as $key => $arr){
            echo $key . " => [" . implode(", ", $arr) . "]<br>";
        }

        echo "MERGED grid: <br>";
        //sort($result["MergedGrid"]);
        foreach($result["MergedGrid"] as $key => $arr){
            echo $key . " => [" . implode(", ", $arr) . "]<br>";
        }

        //echo "<pre>".print_r($result, true)."</pre><br/>";
        */

        break;
    

    case "generateConfig":

        require_once './dbConnect.php';

        $dataFilesNum = $_POST["dataFilesNum"];
        $minAngles = explode(",", $_POST["minAngles"]);
        $maxTolerances = explode(",", $_POST["maxTolerances"]);

        require_once './getRandomTrajectories.php';

        $dataFiles = getRandomTrajectories($dataFilesNum);
        $configsNum = 0;
        $configs = array();
        foreach($dataFiles as $file){
            foreach($minAngles as $angle){
                foreach ($maxTolerances as $tolerance) {
                    $configs[] = "('".$file."', '".$angle."', '".$tolerance."', 'dp')";
                    $configs[] = "('".$file."', '".$angle."', '".$tolerance."', 'combined')";
                }
            }
        }

        mysql_query("INSERT INTO `measurementconfigurations`(filePath, minAngle, maxDistance, measurementType) VALUES " . implode(", ", $configs));
        echo json_encode(count($configs) . " measurement configurations created successfully!");

        break;

    case "generatePairs":

        // generate pairs of trajectories that are similar to each other in the DB
        
        $trajectorySetSize = 50;
        $similarityThreshold = 0.1;
        
        
        /* Clear existing data */
        //mysqli_query($DB_LINK, "TRUNCATE TABLE `pairmeasurements`");
        
        /* Select 2000 random trajectories */
        
        require_once './classes/Trajectory.class.php';
        
        $result = mysqli_query($DB_LINK, "SELECT `json` FROM `trajectoryjson` ORDER BY rand() LIMIT ".$trajectorySetSize);
        
        $trajectories = array();
        while($row = $result->fetch_array()){
            $trajectories[] = Trajectory::fromJson($row[0]);
        }
        
        /* Caluclate similarity of all distinct pairs of the given trajectories */
        require_once './trajectorySimilarity.php';
        $goodPairs = 0;
        // check all distinct pairs
        for ($i=0; $i <= count($trajectories) - 2; $i++){
            for ($j=$i+1; $j <= count($trajectories) - 1; $j++){
                $now = microtime(true);
                $result = getTrajectorySimilarity(array($trajectories[$i], $trajectories[$j]), 500, false, false, true);
                $timeElapsedMS = (microtime(true) - $now)*1000;
                /* Persist the pair to DB if similarity exceeds threshold */
                if($result[0] > $similarityThreshold){
                    mysqli_query($DB_LINK, "INSERT INTO `pairmeasurements`(`path1`, `path2`, `gridSize`, `similarity`, `timeOfCalcMS`, `gridCellsNum`) VALUES ('".$trajectories[$i]->filePath."', '".$trajectories[$j]->filePath."', '500', '".$result[0]."', '".$timeElapsedMS."', '".$result[1]."')");
                    $goodPairs++;
                }
            }
        }
        
        echo $goodPairs . " good pairs with simililarity > ".$similarityThreshold." found and persisted.";
        
        break;

    case "kmeans":
        require_once "./classes/LatLng.class.php";
        $folder = "003";
        if(isset($_GET["folder"])){
            $folder = $_GET["folder"];
        }
        // load trajectories of selected user folder

        $basePath = "sampleDataCleaned";
        $trajectories = array();
        $files = scandir("../" . $basePath. "/" . $folder . "/Trajectory");
        foreach ($files as $file) {
            if ($file != "." && $file != ".." && strpos($file, ".plt") !== false) {
                $trajectories[] = array_map(array("LatLng", "fromArray"), readData($basePath . "/" . $folder . "/Trajectory/" . $file));
            }
        }

        require_once './k_medoids.php';

        $numClusters = 3;
        echo json_encode(kMedoids($trajectories, $numClusters));

        break;

    case "getRandomPair":

        $result = mysqli_query($DB_LINK, "SELECT * FROM `pairmeasurements` ORDER BY rand() LIMIT 1");
        echo json_encode($result->fetch_assoc());
        $result->close();
        break;

    case "getRandoms":
        require_once './getRandomTrajectories.php';
        $trajectoriesCount = 2;
        if(isset($_POST["trajectoriesCount"])){
            $trajectoriesCount = $_POST["trajectoriesCount"];
        }
        $gridSizeMeters = 500;
        if(isset($_POST["gridSizeMeters"])){
            $gridSizeMeters = $_POST["gridSizeMeters"];
        }
        $trajectoryFilePaths = getRandomTrajectories($trajectoriesCount);

        //echo "<pre>"; print_r($trajectoryFilePaths); echo "</pre>";

        require_once './fileReader.php';
        foreach($trajectoryFilePaths as $path){
            $trajectories[] = readData($path);
        }

        echo json_encode($trajectories); exit;

        require_once './getGrid.php';
        echo json_encode(getGrid($trajectories, $gridSizeMeters, $_POST["whichGrid"]));
        break;

    case "getGivenTrajectories":
        $trajectoryFilePaths = array($_POST["trajectory1"], $_POST["trajectory2"]);

        foreach($trajectoryFilePaths as $path){
            $trajectories["data"][] = readData($path);
        }

        echo json_encode($trajectories);

        //require_once './getGrid.php';
        //getGrid($trajectories, $gridSizeMeters);

        break;

    case "getGrid":

        $trajectoryFilePaths = array($_POST["trajectory1"], $_POST["trajectory2"]);

        foreach($trajectoryFilePaths as $path){
            $trajectories[] = readData($path);
        }

        require_once './getGrid.php';

        $gridSizeMeters = 500;
        if(isset($_POST["gridSizeMeters"])){
            $gridSizeMeters = $_POST["gridSizeMeters"];
        }

        $whichGrid = 1;
        if(isset($_POST["whichGrid"])){
            $whichGrid = $_POST["whichGrid"];
        }

        echo json_encode(getGrid($trajectories, $gridSizeMeters, $whichGrid));

        break;

    case "getRandom":

        require_once './getRandomTrajectories.php';
        $getKeys = array_keys($_GET);
        $howMany = count($getKeys) > 0 ? $getKeys[0] : 1;

        echo json_encode(getRandomTrajectories($howMany));

        break;

    case "angleCut":

        $filePath = $_POST["filePath"];
        $minAngle = $_POST["minAngle"];

        require_once './angleFilter.php';

        echo json_encode(doAngleFilter($filePath, $minAngle));

        break;

    case "douglasPeucker":
        $trajectoryData = $_POST["data"];
        $maxDeviationMeters = $_POST["tolerance"];

        require_once './douglasPeuckerFilter.php';
        $result = douglasPeuckerFilter($trajectoryData, $maxDeviationMeters);
        echo json_encode($result["data"]);

        break;

    case "cleanFolder":
        /*
        $folderName = $_GET["folder"] . "";

        if($folderName == ""){
            echo "No folder name specified";
            break;
        }
         *
         */
        require_once './cleanFolder.php';

        $folders = scandir("../sampleData/");
        $folders = array_splice($folders, 2, count($folders)-2);
        //echo "<pre>".print_r($folders, true)."</pre>"; break;
        foreach($folders as $folder){
            cleanFolder($folder);
        }



        break;

    case "testDb":

        require_once './dbConnect.php';

        $result = mysqli_query($DB_LINK, "SELECT COUNT(*) AS 'num' FROM `trajectory`");
        $row = $result->fetch_assoc();
        echo "<pre>"; print_r($row);
        mysqli_free_result($result);

        break;

    case "both":

        break;
}


function calculateStoreDistanceMatrix($DB_LINK, $userId, $gridSizeMeters){
    $distanceMatrix = array();

        require_once './loadTrajectories.php';
        require_once './trajectorySimilarity.php';


        $trajectoryObjects = loadTrajectories($DB_LINK, null, true, $userId);

        $calculationsNum = 0;
        for ($i=0; $i <= count($trajectoryObjects) - 2; $i++){
            for ($j=$i+1; $j <= count($trajectoryObjects) - 1; $j++){
                // current pair
                /* @var $tr1 Trajectory */
                /* @var $tr2 Trajectory */

                $tr1 = $trajectoryObjects[$i];
                $tr2 = $trajectoryObjects[$j];

                $trajectoryIds = json_encode(array($tr1->id, $tr2->id));
                $trajectoryLengths = json_encode(array(count($tr1->points), count($tr2->points)));
                $trajectoryTotalLength = count($tr1->points) + count($tr2->points);

                // calculate distance
                $currTime = round(microtime(true) * 1000);
                $similarity = getTrajectorySimilarity(array($tr1, $tr2), $gridSizeMeters);
                $timeOfCalculation = round(microtime(true) * 1000) - $currTime;

                $record = array(
                    "trajectoryIds" => "'".$trajectoryIds."'",
                    "trajectoryLengths" => "'".$trajectoryLengths."'",
                    "trajectoryTotalPointsNum" => "'".$trajectoryTotalLength."'",
                    "`time`" => "'".$timeOfCalculation."'"
                );
                $query = "INSERT INTO `distance_calculations`(" . implode(", ", array_keys($record)) . ") VALUES (".implode(", ", array_values($record)).")";
                mysqli_query($DB_LINK, $query);
                //echo $query;

                $distanceMatrix[$tr1->id][$tr2->id] = $similarity;
                $calculationsNum++;
            }
        }
        $matrixJSON = json_encode($distanceMatrix);

        mysqli_query($DB_LINK, "INSERT INTO `distancematrix`(subjectId, gridSizeMeters, matrixJSON, distanceCalculations) VALUES ('".$userId."', '".$gridSizeMeters."', '".$matrixJSON."', '".$calculationsNum."')");
}

function errHandle($errNo, $errStr, $errFile, $errLine) {
    $msg = "$errStr in $errFile on line $errLine";
    logToFile($msg);

    throw new ErrorException($msg, $errNo);
    /*
    if ($errNo == E_NOTICE || $errNo == E_WARNING) {
        throw new ErrorException($msg, $errNo);
    } else {
        echo $msg;
    }
     *
     */
}

$DB_LINK->close();

set_error_handler('errHandle');



function logToFile($msg, $tag="") {
    $today = date("Y-m-d");
    $logfilepath = "../log/" . $today . "_log.html";

    /*
    $date_format = "d-m-Y H:i:s";

    $userAgent = ""; // ( isset($_SERVER['HTTP_USER_AGENT']) && ($_SERVER['HTTP_USER_AGENT'] != "")) ? $_SERVER['HTTP_USER_AGENT'] : "Unknown";
    $userIp = ( isset($_SERVER['REMOTE_ADDR']) && ($_SERVER['REMOTE_ADDR'] != "")) ? $_SERVER['REMOTE_ADDR'] : "Unknown";
    $refferer = ( isset($_SERVER['HTTP_REFERER']) && ($_SERVER['HTTP_REFERER'] != "")) ? $_SERVER['HTTP_REFERER'] : "Unknown";
    $uri = ( isset($_SERVER['REQUEST_URI']) && ($_SERVER['REQUEST_URI'] != "")) ? $_SERVER['REQUEST_URI'] : "Unknown";

    $hostName = ""; // gethostbyaddr($userIp);
    $actualTime = date($date_format);
    */
    $logEntry = "<br/>".$msg."\n";

    if (!file_exists($logfilepath)) {
        $logFile = fopen($logfilepath, "w");
    } else {
        $logFile = fopen($logfilepath, "a");
    }

    fwrite($logFile, $logEntry);
    fclose($logFile);
}