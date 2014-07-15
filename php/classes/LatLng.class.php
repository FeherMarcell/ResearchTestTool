<?php

class LatLng{

    var $lat, $lng, $timestamp;
    var $gridCellCoordsPrimary = array();
    var $gridCellCoordsSecondary = array();

    function __construct($lat=0, $lng=0, $timestamp = 0) {
        $this->lat = $lat;
        $this->lng = $lng;
        $this->timestamp = $timestamp;
    }

    public static function fromArray(array $array){
        return new self($array[0], $array[1]);
    }

    public function isInSameCell(LatLng $theOther, $isPrimary){
        if($isPrimary){
            return $this->gridCellCoordsPrimary[0] === $theOther->gridCellCoordsPrimary[0] && $this->gridCellCoordsPrimary[1] === $theOther->gridCellCoordsPrimary[1];
        }
        else{
            return $this->gridCellCoordsSecondary[0] === $theOther->gridCellCoordsSecondary[0] && $this->gridCellCoordsSecondary[1] === $theOther->gridCellCoordsSecondary[1];
        }

    }

    public function isInNeighborCell(LatLng $theOther, $isPrimary){
        // alatta, folotte, jobbra vagy balra levo cellaban van a masik, NEM atloban!

        // sorindex kulonbseg 1, oszlopindex kulonbseg 0
        // VAGY
        // sorindex kulonbseg 0, oszlopindex kulonbseg 1
        if($isPrimary){
            return
            ((abs($this->gridCellCoordsPrimary[0] - $theOther->gridCellCoordsPrimary[0]) == 1) && (abs($this->gridCellCoordsPrimary[1] - $theOther->gridCellCoordsPrimary[1]) == 0))
            ||
            ((abs($this->gridCellCoordsPrimary[0] - $theOther->gridCellCoordsPrimary[0]) == 0) && (abs($this->gridCellCoordsPrimary[1] - $theOther->gridCellCoordsPrimary[1]) == 1));
        }
        else{
            return
            ((abs($this->gridCellCoordsSecondary[0] - $theOther->gridCellCoordsSecondary[0]) == 1) && (abs($this->gridCellCoordsSecondary[1] - $theOther->gridCellCoordsSecondary[1]) == 0))
            ||
            ((abs($this->gridCellCoordsSecondary[0] - $theOther->gridCellCoordsSecondary[0]) == 0) && (abs($this->gridCellCoordsSecondary[1] - $theOther->gridCellCoordsSecondary[1]) == 1));
        }

    }



}

