var mapStyle = [
    {
        stylers: [
            {hue: "#996e13"},
            {gamma: 2.61},
            {saturation: -20},
            {visibility: "simplified"}
        ]
    }, {
        featureType: "road",
        elementType: "geometry",
        stylers: [
            {lightness: 100},
            {visibility: "simplified"}
        ]
    }, {
        featureType: "road",
        elementType: "labels",
        stylers: [
            {visibility: "off"}
        ]
    }, {
        featureType: "administrative",
        elementType: "all",
        stylers: [
            {visibility: "off"}
        ]
    }, {
        featureType: "poi",
        elementType: "all",
        stylers: [
            {visibility: "off"}
        ]
    }, {
        featureType: "transit",
        elementType: "all",
        stylers: [
            {visibility: "off"}
        ]
    }, 
    { featureType: "administrative.country", elementType: "all", stylers: [{ visibility: "on"}] }
];
var mapOptions = {
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(39.996948, 116.325747),
    styles: mapStyle,
    scaleControl: true,
    opacity: .5,
    panControl: false,
    zoomControl: false,
    streetViewControl: false
    
};
var trajectoryColors = ["#B23C00", "#FFC108", "#FF0000", "#07CC2A", "#9BB205", "#276EB2", "#FF46BC", "#13FFEE", "#2500CC", "#9300B2"];
var polyPaths = [google.maps.SymbolPath.CIRCLE, "M -1,-1 1,1 M 1,-1 -1,1", "M -1,-1 -1,1 1,1 1,-1 z", "M -1,0 0,-1 1,0 0,1 z"];
var polyOptions = {
    strokeOpacity: .5,
    strokeWeight: 3,
    zIndex: 10
};