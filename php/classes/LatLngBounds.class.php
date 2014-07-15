<?php

require_once 'LatLng.class.php';

class LatLngBounds{

    /**
     * @var LatLng
     */
    public $northEast;
    /**
     * @var LatLng
     */
    public $southWest;

    public function __construct(LatLng $northEast, LatLng $southWest) {
        $this->northEast = $northEast;
        $this->southWest = $southWest;
    }

    public function contains(LatLng $point){

        return
            ($this->southWest->lat <= $point->lat) &&
            ($point->lat <= $this->northEast->lat) &&
            ($this->southWest->lng <= $point->lng) &&
            ($point->lng <= $this->northEast->lng);
    }

    public static function fromTrajectories($trajectories){
        $ne = new LatLng($trajectories[0][0]->lat, $trajectories[0][0]->lng);
        $sw = new LatLng($trajectories[0][0]->lat, $trajectories[0][0]->lng);

        foreach($trajectories as $trajectory){
            foreach($trajectory as $p){
                if($p->lat > $ne->lat){ $ne->lat = $p->lat; }
                if($p->lng > $ne->lng){ $ne->lng = $p->lng; }

                if($p->lat < $sw->lat){ $sw->lat = $p->lat; }
                if($p->lng < $sw->lng){ $sw->lng= $p->lng;  }
            }
        }
        return new self($ne, $sw);
    }

    public function calculateNW(){
        return new LatLng($this->northEast->lat, $this->southWest->lng);
    }

    public function calculateSE(){
        return new LatLng($this->southWest->lat, $this->northEast->lng);
    }

    public function isOverlapping(LatLngBounds $theOther){
        if(
            $this->northEast->lat < $theOther->southWest->lat
            ||
            $this->southWest->lng > $theOther->northEast->lng
            ||
            $this->northEast->lng < $theOther->southWest->lng
            ||
            $this->southWest->lat > $theOther->northEast->lat
            ){
            return false;
        }
        return true;
    }

    public function trimToIntersection(LatLngBounds $theOther){
        $ne = new LatLng();
        $sw = new LatLng();

        $ne->lat = min($this->northEast->lat, $theOther->northEast->lat);
        $ne->lng = min($this->northEast->lng, $theOther->northEast->lng);

        $sw->lat = max($this->southWest->lat, $theOther->southWest->lat);
        $sw->lng = max($this->southWest->lng, $theOther->southWest->lng);

        $this->northEast = $ne;
        $this->southWest = $sw;
    }

    function getArea(){
        $latSpan = $this->northEast->lat - $this->southWest->lat;
        $lonSpan = $this->northEast->lng - $this->southWest->lng;
        return max(0, $latSpan * $lonSpan);
    }




}