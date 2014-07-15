<?php

class SimpleLatLon{
    var $_lat, $_lon;
    static $RAD_FACTOR;
    var $_time, $_id;
        
    
    public function __construct($lat, $lon, $time=null, $id=null) {
        $this->_lat = $lat;
        $this->_lon = $lon;
        $this->_time = $time;
        $this->_id = $id;
    }
    
    
    public function distanceTo(SimpleLatLon $point){
        $lat1 = SimpleLatLon::toRad($this->_lat); $lon1 = SimpleLatLon::toRad($this->_lon);
        $lat2 = SimpleLatLon::toRad($point->_lat); $lon2 = SimpleLatLon::toRad($point->_lon);
        
        $dLat = $lat2 - $lat1;
        $dLon = $lon2 - $lon1;
        
        $a = sin($dLat/2) * sin($dLat/2) + cos($lat1) * cos($lat2) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        return 6371000.0 * $c;
    }
    
    private static function toRad($num){
        return $num * SimpleLatLon::$RAD_FACTOR;
    }

    private static function toDeg($num){
        return $num * 180 / pi();
    }
    
    public function __toString() {
        return "SimpleLatLon[$this->_lat, $this->_lon]";
    }

    
}

SimpleLatLon::$RAD_FACTOR = 3.141592653589793238462643383279502884197169399375105820974944592307816406286 / 180.0;