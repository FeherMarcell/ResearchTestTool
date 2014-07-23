<?php

/**
 * Description of DbScan
 *
 * @author sw0rdf1sh
 */
class DbScan {

    private $minSimilarity; // Minimum similarity value of 2 points to consider them density-reachable (between 0 and 1, where 1 means very similar)
    private $minPointsOfCluster; // Minimal number of points needed to form a cluster
    private $dataPoints = array(); // Array holding all the data points

    private $visitedPointIndicies = array(); // Array that holds the indicies of 'dataPoints' that have already been visited by the algorithm
    private $currentClusterId = 0; // Running index of the cluster ID

    private $distanceCalulationsCnt = 0; // internal counter of number of distance calculations (for stats only)

    public static function getClusters($data, $minSimilarity = 0.5, $minClusterSize = 6){

        $instance = new DbScan($data, $minSimilarity, $minClusterSize);

        // do the clustering
        $instance->dbScan();

        logToFile("Number of distance calculations during clustering: " . $instance->distanceCalulationsCnt);

        $clusters = array();
        foreach($instance->dataPoints as $item){
            if($item["clusterId"] != null){
                $clusters[$item["clusterId"]][] = $item["data"];
            }
        }
        return $clusters;
    }

    // prevent instantiation
    private function __construct($data, $minSimilarity, $minClusterSize) {
        foreach($data as $item){
            $this->dataPoints[] = array("clusterId" => null, "data" => $item);
        }

        $this->minSimilarity = $minSimilarity;
        $this->minPointsOfCluster = $minClusterSize;
    }



    // entry point of the DbScan algorithm
    private function dbScan(){

        for($idx = 0 ; $idx < count($this->dataPoints) ; $idx++){
        
            logToFile("<hr>Checking point #".$this->dataPoints[$idx]["data"]->id."...<br>");

            // skip if the point is already visited
            if(in_array($idx, $this->visitedPointIndicies)){
                logToFile(" Already visited, skipping<br>");
                continue;
            }

            // add point to visited array
            $this->visitedPointIndicies[] = $idx;

            // calculate the region of current point
            $neighborsIndicies = $this->regionQuery($idx);
            logToFile(" Region of current point contains <b>".count($neighborsIndicies)." points</b><br>");

            if(count($neighborsIndicies) >= $this->minPointsOfCluster){
                // start a new cluster with the current point
                $this->currentClusterId++;
                $this->addToCluster($idx);

                $this->expandCluster($neighborsIndicies);
            }
        }
    }


    private function expandCluster(&$regionPointIndicies){

        //$pointIndiciesOfCluster = $regionPointIndicies;
        $set = array();
        // explore region points
        for($i=0 ; $i<count($regionPointIndicies) ; $i++){
            $pointIdx = $regionPointIndicies[$i];
        
            $set[] = $pointIdx;

            if(!in_array($pointIdx, $this->visitedPointIndicies)){
                $this->visitedPointIndicies[] = $pointIdx;
                $neighborIndicies = $this->regionQuery($pointIdx);

                if(count($neighborIndicies) >= $this->minPointsOfCluster){
                    // add neighbor points to cluster
                    foreach($neighborIndicies as $idx){
                        if(!in_array($idx, $set)){
                            $this->addToCluster($idx);
                        }
                    }
                }
            }

            if($this->dataPoints[$pointIdx]["clusterId"] == null){
                $this->addToCluster($pointIdx);
            }
        }
    }

    private function addToCluster($idxOfPoint){
        $this->dataPoints[$idxOfPoint]["clusterId"] = $this->currentClusterId;
    }

    /**
     * Returns array of indicies of $dataPoints, that are in the region of the given $dataPointIdx (incluing the $point itself!)
     *
     * @param type $dataPointIdx
     * @return type
     */
    private function regionQuery($dataPointIdx){
        $pointData = $this->dataPoints[$dataPointIdx]["data"];
        logToFile("Region query of point #" . $this->dataPoints[$dataPointIdx]["data"]->id);
        $result = array();
        logToFile("total size of dataPoints: " . count($this->dataPoints));
        for($idx = 0 ; $idx < count($this->dataPoints) ; $idx++){
            $dataItem = $this->dataPoints[$idx];
        
            logToFile("Checking distance of " . $idx." <-> ".$dataPointIdx . ": ");
            // the point will always be in it's own region
            if($idx === $dataPointIdx){
                $result[] = $idx;
                logToFile("ITSELF");
                continue;
            }

            // check if the similarity is already calculated and retrieve the cached value
            $storedSimilarity = $this->getStoredSimilarity($idx, $dataPointIdx);
            if($storedSimilarity !== false){
                logToFile("Stored ");
                if($storedSimilarity >= $this->minSimilarity){
                    logToFile("similar");
                    $result[] = $idx;
                }
                else{
                    logToFile("not similar");
                }
                
                continue;
            }
            logToFile("Not stored, calculating and storing...");
            // if it's not stored, calculate and store now
            $now = round(microtime(true) * 1000);
            $similarity = getTrajectorySimilarity(array($pointData, $dataItem["data"]));
            $timeInMS = round(microtime(true) * 1000) - $now;
            logToFile(" -- Similarity calculation took " . $timeInMS . "ms. Total #points:  " . (count($pointData) + count($dataItem["data"])));
            // echo "similarity: " . $similarity; exit;
            
            $this->distanceCalulationsCnt++;
            $this->storeSimilarity($idx, $dataPointIdx, $similarity);

            if($similarity >= $this->minSimilarity){
                logToFile(" Found similar");
                $result[] = $idx;
            }
            else{
                logToFile(" Found NOT similar");
            }
                
        }
        return $result;
    }

    private function getStoredSimilarity($pointIdx1, $pointIdx2){
        if(isset($this->distances[$pointIdx1][$pointIdx2])){
            return $this->distances[$pointIdx1][$pointIdx2];
        }
        if(isset($this->distances[$pointIdx2][$pointIdx1])){
            return $this->distances[$pointIdx2][$pointIdx1];
        }
        return false;
    }

    private function storeSimilarity($pointIdx1, $pointIdx2, $similarity){
        $this->distances[$pointIdx1][$pointIdx2] = $similarity;
        //$distances[$pointIdx2][$pointIdx1] = $similarity;
    }

    private $distances = array();

}
