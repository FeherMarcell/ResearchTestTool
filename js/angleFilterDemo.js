var mapObject = {}, trajectoryData = [];
var polyline = new google.maps.Polyline();

$(document).ready(function() {
    mapObject = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    polyline.setMap(mapObject);

    //mapObject.data.loadGeoJson("php/getGeoJSON.php");
    mapObject.data.loadGeoJson("https://storage.googleapis.com/maps-devrel/google.json");

    $("#loadRandom").click(function() {
        $.get(
            "php/getRandomTrajectory.php",
            function(data) {
                console.log("Data received: "); console.log(data);
                trajectoryData = data.data;
                displayTrajectory(trajectoryData);

            },
            "json"
            );
    });
});

var latlngs = [], markers = [], currentLatlng = new google.maps.LatLng();
var bounds = new google.maps.LatLngBounds();
function displayTrajectory(trajectory, fitBounds){

    if(fitBounds === undefined){
        fitBounds = true;
    }

    for(var i=0 ; i<markers.length ; i++){
        markers[i].setMap(null);
        markers[i] = null;
    }
    markers = [];

    if(fitBounds) bounds = new google.maps.LatLngBounds();
    polyline.setMap(null);
    polyline = null;
    polyline = new google.maps.Polyline(polyOptions);
    polyline.setMap(mapObject);

    path = polyline.getPath();

    for (var i = 0; i<trajectoryData.length ; i++){
        currentLatlng = new google.maps.LatLng(trajectoryData[i][0], trajectoryData[i][1]);

        // add to path
        path.push(currentLatlng);

        // add marker
        markers.push(new google.maps.Marker({
            map: mapObject,
            position: currentLatlng,
            title: i+"",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillOpacity: 1,
                scale: 3
            },
            zIndex: 11
        }));

        google.maps.event.addListener(markers[markers.length-1], 'click', function() {
            removePointAtMarker(this.title);
          });

        // extend the bounds
        if(fitBounds) bounds.extend(currentLatlng);
    }
    // set map to fit the full trajectory
    if(fitBounds) mapObject.fitBounds(bounds);
}

function removePointAtMarker(idx){
    displayTrajectory(trajectoryData.splice(idx, 1), false); return;
    console.log("removing point at " + idx);
    markers[idx].setMap(null);
    markers[idx]  = null;

    path = polyline.getPath();
    console.log(path);
    path.j.splice(idx, 1);
}
