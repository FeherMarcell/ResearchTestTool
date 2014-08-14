<?php

class Trajectory{
    
    /* Mandatory members */
    public $id; // unique identifier
    public $boundingBox; // the bounding rectangle in the domain of points. Structure: array( array(Xmax, Ymax), array(Xmin, Ymin) )
    public $points; // array of points, each of them is array(x, y, time), where 'time' is an integer (e.g. seconds value, not a time string)
    
    /* Optional members */
    public $length; // spatial length of the whole trajectory
    public $timeSpan; // max(time) - min(time)

    public function __construct($_id, $_boundingBoxArray, $_points, $_length=0, $_timeSpan=0){
      $this->id = $_id;
      $this->boundingBox = $_boundingBoxArray;
      $this->points = $_points;
      
      $this->length = $_length;
      $this->timeSpan = $_timeSpan;
    }
    
    public static $mandatoryFieldKeys = array("id", "boundingBox", "points");
    public static function validateJsonKeys(array $keys){
        foreach(Trajectory::$mandatoryFieldKeys as $key){
            if(!in_array($key, $keys)){
                throw new Exception("Mandatory key '".$key."' is missing from Trajectory JSON representation! (keys: ".implode(", ", Trajectory::$mandatoryFieldKeys).")");
            }
        }
        return true;
    }
    
    public static function fromJson($json){
        $arr = json_decode($json, true);
        $keys = array_keys($arr);
        Trajectory::validateJsonKeys($keys);
        
        // checking for optional members, set them to default if not found
        if(!in_array("length", $keys)){ $arr["length"] = 0; }
        if(!in_array("timeSpan", $keys)){ $arr["timeSpan"] = 0; }
        
        $tr = new Trajectory(
                $arr["id"], 
                $arr["boundingBox"],
                $arr["points"],
                $arr["length"],
                $arr["timeSpan"]
                );
        return $tr;
    }
    
    public function __toString() {
        return "Trajectory #$this->id (".count($this->points)." points)";
    }

    

}