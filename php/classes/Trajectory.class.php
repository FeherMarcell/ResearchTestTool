<?php

class Trajectory /* implements Serializable*/{
    public $id, $subjectId, $filePath, $date, $timeSpan, $boundingBox, $length, $avgLatitude;
    public $points;

    public function __construct($_id, $_subjectId, $_filePath, $_date, $_timeSpan, $_boundingBoxString, $_length, $_avgLatitude){
      $this->id = $_id;
      $this->subjectId = $_subjectId;
      $this->filePath = $_filePath;
      $this->date = $_date;
      $this->timeSpan = $_timeSpan;
      $tmp = explode(" ", $_boundingBoxString);
      $this->boundingBox = array(
         array($tmp[0], $tmp[1]),
         array($tmp[2], $tmp[3])
         );
      $this->length = $_length;
      $this->avgLatitude = $_avgLatitude;
    }
    
    public static function fromJson($json){
        $arr = json_decode($json, true);
        
        $tr = new Trajectory(
                $arr["id"], 
                $arr["subjectId"], 
                $arr["filePath"], 
                $arr["date"], 
                $arr["timeSpan"], 
                $arr["boundingBox"][0][0]." ".$arr["boundingBox"][0][1]." ".$arr["boundingBox"][1][0]." ".$arr["boundingBox"][1][1],
                $arr["length"], 
                $arr["avgLatitude"]);
        
        $tr->points = $arr["points"];
        
        return $tr;
    }
    
    public function __toString() {
        return "Trajectory #$this->id [$this->filePath]";
    }

    
    /* DO NOT USE serialize() and deserialize(), JSON representation is faster to encode & decode */
    
    /* Delimiter characters used for serialization and deserialization of the object */
    /*
    private static $internal_delimiter = "*";
    private static $points_delimiter = "_";
    private static $parts_delimiter = "|";
    */
    
    /**
    @UnTested
     */
    /*
    public function serialize() {
        $arr[] = $this->id; // 0
        $arr[] = $this->subjectId; // 1
        $arr[] = $this->filePath; // 2
        $arr[] = $this->date; // 3
        $arr[] = $this->timeSpan; // 4
        $arr[] = $this->boundingBox[0][0] . Trajectory::$internal_delimiter . $this->boundingBox[0][1] . Trajectory::$internal_delimiter . $this->boundingBox[1][0] . Trajectory::$internal_delimiter . $this->boundingBox[1][1];
        $arr[] = $this->length; // 6
        $arr[] = $this->avgLatitude; // 7
        $pointsArr = array();
        for($i=0 ; $i<count($this->points) ; $i++){
            $pointsArr[] = implode(Trajectory::$internal_delimiter, $this->points[$i]);
        }
        $arr[] = implode(Trajectory::$points_delimiter, $pointsArr);
        return implode(Trajectory::$parts_delimiter, $arr);
    }
    */
    
    /**
    @UnTested
     */
    /*
    public function unserialize($serialized) {

        $outerArr = explode(Trajectory::$parts_delimiter, $serialized);
        $bbParts = explode(Trajectory::$internal_delimiter, $outerArr[5]);
        $trajectory = new Trajectory(
                $outerArr[0], $outerArr[1], $outerArr[2], $outerArr[3], $outerArr[4],
                array(array($bbParts[0], $bbParts[1]), array($bbParts[2], $bbParts[3])),
                $outerArr[6], $outerArr[7]);
        $pointsArr = explode(Trajectory::$points_delimiter, $outerArr[8]);
        // deserializing points
        for($i=0 ; $i<count($pointsArr) ; $i++){
            $pointsArr[$i] = explode(Trajectory::$internal_delimiter, $pointsArr[$i]);
        }
        $trajectory->points = $pointsArr;

        return $trajectory;
    }
    */

}