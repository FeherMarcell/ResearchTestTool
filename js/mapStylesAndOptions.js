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
    }
];
var mapOptions = {
    zoom: 10,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    center: new google.maps.LatLng(39.996948, 116.325747),
    styles: mapStyle,
    scaleControl: true,
    opacity: .5,
    scaleControlOptions: {position: google.maps.ControlPosition.BOTTOM_LEFT}
};
var polyOptions = {
    strokeColor: "#000",
    strokeOpacity: 1,
    strokeWeight: 3,
    zIndex: 10
};