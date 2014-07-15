var mapObject;

var displayDataConfig = {
    showMarkers: false,
    showPath: true,
    drawBoundingBox: false,
    clearFirst: false
};

var trajectoryPolys = [];

$(document).ready(function() {

    mapObject = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    $("#paths").on("input propertychange", function(e) {
        var paths = e.target.value.split(/\n/);

        var colorIdx = Math.round(Math.random() * (trajectoryColors.length - 1));
        polyOptions.strokeColor = trajectoryColors[colorIdx];
        var bounds = null;
        for (var i in paths) {
            $.get(paths[i], {}, function(result) {
                var data = [];
                var arr = result.split(/\n/);
                for(var idx in arr){
                    if(arr[idx] !== ""){
                        data.push(arr[idx].split(","));
                    }
                }
                
                console.log(data);
                bounds = displayTrajectoryData(data, null, bounds, null);
            });

        }
    });

});



function displayTrajectoryData(trajectoryData, config, bounds, domElementToColor) {


    if (config === null || config === undefined) {
        config = displayDataConfig;
    }

    if (bounds === null || bounds === undefined) {
        bounds = new google.maps.LatLngBounds();
    }

    //convert data points to LatLng objects
    var latLngs = [];
    for (var i = 0; i < trajectoryData.length; i++) {
        latLngs.push(new google.maps.LatLng(trajectoryData[i][0], trajectoryData[i][1]));
        //bounds.extend(latLngs[i]);
    }

    // latLngs & bounds ready


    if (config.showPath) {

        var poly = new google.maps.Polyline(polyOptions);
        poly.setMap(mapObject);
        var path = poly.getPath();
        for (i in latLngs) {
            path.push(latLngs[i]);
        }
        trajectoryPolys.push(poly);
    }


    //mapObject.fitBounds(bounds);
    return bounds;
}