<?php

require_once 'LatLngBounds.class.php';
require_once 'LatLng.class.php';

/**
 * Description of GridCell
 *
 * @author sw0rdf1sh
 */
class GridCell {
    /**
     * @var LatLngBounds 
     */
    public $bounds;
    
    public $crossingTrajectoryIds = array();
    
    public function __construct(LatLngBounds $bounds) {
        $this->bounds = $bounds;
    }
    
    public function addToCrossing($trajectoryId){
        if(!in_array($trajectoryId, $this->crossingTrajectoryIds)){
            $this->crossingTrajectoryIds[] = $trajectoryId;
        }
    }
}
