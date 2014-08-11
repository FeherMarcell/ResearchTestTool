<?php

class TimeSyncSimilarity{
    
    private $trajectories;
    private $loggingEnabled;
    
    // prevent instantiation
    private function __construct($trajectories) {
        $this->trajectories = $trajectories;
    }
    
    public static function getSimilarity($trajectories, $loggingEnabled=false){
        $instance = new TimeSyncSimilarity($trajectories);
        $instance->loggingEnabled = $loggingEnabled;
        
        return $instance->calculateSimilarity();
    }
    
    private function calculateSimilarity(){
        
    }

    
    
    
}