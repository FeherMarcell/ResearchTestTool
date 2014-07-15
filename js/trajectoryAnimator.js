
var mapObject = {};
var availableColors = [], availablePaths = [];
var trajectoryData = [], trajectory2Data = [];
var trajectoryPolys = [];
var dataFiles = [];

mapOptions.zoom = 11;
var currentTimeSeconds = 0, endTime = 0, startTime = 0, timeSpan = 0;
var timeSlider = null, isPlaying = false, stopAnimation = false;
var playPauseBtn = null, slowerBtn = null, fasterBtn = null;
var animationSpeed = 0.5;
var speeds = [];

$(document).ready(function(){
   
    mapObject = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    
    timeSlider = $("#timeSlider").slider({ animate: true, step: 1, slide: timeChanged });
    playPauseBtn = $("#playPause").button({icons: {primary: 'ui-icon-locked'}, text: false});
    playPauseBtn.click(function(){
        // restart
        if(currentTimeSeconds >= endTime){
            currentTimeSeconds = startTime;
        }
        isPlaying = !isPlaying;
        setPlayButton();
        if(isPlaying){
            window.requestAnimationFrame(timeChanged);
        }
    });
    slowerBtn = $("#slowerBtn").button();
    fasterBtn = $("#fasterBtn").button();
    slowerBtn.click(function(){ animationSpeed /= 2; });
    fasterBtn.click(function(){ animationSpeed *= 2; });
    
    $.get("./php/getRandomTrajectory.php", {}, function(trajectory){
        availableColors = jQuery.extend(true, [], trajectoryColors);
        availablePaths = jQuery.extend(true, [], polyPaths);
        
        displayTrajectoryData(trajectory);
        
        for(var idx = 0 ; idx < trajectory.length ; idx++){
            var dist = 0;
            if(trajectory[idx+1] !== undefined){
                dist = getDistance(trajectory[idx][0], trajectory[idx][1], trajectory[idx+1][0], trajectory[idx+1][1]);
            }
            var currentTime = getSecondValue(trajectory[idx][2]);
            trajectory[idx].push(currentTime);
            trajectory[idx].push(dist);
            
            var speed = 0;
            if(idx > 0){
                speed = trajectory[idx-1][4] / (currentTime - trajectory[idx-1][3]);
                
                speeds.push([currentTime, speed]);
                /*
                for(var time = trajectory[idx-1][3] ; time < currentTime ; time++){
                    speeds.push(speed);
                }
                */
            }
            
        }
        
        
        
        currentTimeSeconds = trajectory[0][3];
        startTime = currentTimeSeconds;
        
        endTime = trajectory[trajectory.length-1][3];
        timeSpan = endTime - startTime;
        
        
        $("#currentTime").text(trajectory[0][2]);
        
        $("#startTime").text(trajectory[0][2]);
        $("#endTime").text(trajectory[trajectory.length-1][2]);
        $("#middleTime").text(getTimeString((trajectory[0][3]+endTime)/2));
        console.log(trajectory);
        
        timeSlider.slider("option", "min", trajectory[0][3]);
        timeSlider.slider("option", "max", endTime);
        isPlaying = false;
        setPlayButton();
        window.requestAnimationFrame(timeChanged);
        
        // create chart data
        
        for(var time = startTime ; time < endTime ; time++){
            
        }
        
        // set up chart
        $("#chart").highcharts({
            chart: { type: 'spline', zoomType: 'xy' },
            title: { text: "Speed of movement" },
            tooltip: { enabled: false },
            plotOptions: {
                line: {
                    marker: {
                        enabled: false
                    }
                }
            },
            xAxis: { 
                title: {text: "Time"},
                labels: {
                    formatter: function() {  return getTimeString(startTime + this.value); }
                }
            },
            yAxis: {
                floor: 0,
                title: {text: "Speed"},
                labels: {
                    formatter: function() { return (this.value * 3.6) +' km/h'; }
                },
                plotLines: [
                    {
                        color: '#FF0000',
                        label: "Walking speed",
                        width: 2,
                        value: 1.4 // 5 km/h in m/s
                    },
                    {
                        color: '#00FF00',
                        label: "Top bike riding speed",
                        width: 2,
                        value: 9.7 // 35 km/h in m/s
                    }
                ]
            
            },
            series: [
                {
                    name: "User #1",
                    data: speeds
                }
            ]
            
        });
        
    }, "json");
});

var RAD_FACTOR = Math.PI / 180.0;

function getDistance(lat1, lon1, lat2, lon2){
    lat1 = toRad(lat1); lon1 = toRad(lon1);
    lat2 = toRad(lat2); lon2 = toRad(lon2);
    
    var dLat = lat2 - lat1;
    var dLon = lon2 - lon1;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return 6371000.0 * c;
}

function toRad(deg){ return deg * RAD_FACTOR; }

function setPlayButton(){
    var btn = 'ui-icon-play';
    if(isPlaying){
        btn = 'ui-icon-pause';
    }
    playPauseBtn.button({icons: {primary: btn}});
}

function timeChanged(event){
    //console.log("timeChanged event: "); console.log(event);
   
   if(event.type === "slide"){
       currentTimeSeconds = timeSlider.slide("value");
   }
   
    if(!isPlaying || currentTimeSeconds >= endTime){
        isPlaying = false;
        setPlayButton();
        return;
    }
    
    currentTimeSeconds += animationSpeed;
    
    var currentTimePercent = Math.min(100, (((currentTimeSeconds - startTime) / timeSpan) * 100));
    var currentSpeed = speeds[currentTimeSeconds + startTime];
    
    //var currentTrack = ;
    
    var icon = trajectoryPolys[0].get('icons');
    icon[0].offset = currentTimePercent + '%';
    trajectoryPolys[0].set('icons', icon);
    
    
    $("#currentTime").text(getTimeString(currentTimeSeconds));
    timeSlider.slider("value", currentTimeSeconds);
    
    window.requestAnimationFrame(timeChanged);
};

function getSecondValue(timestring){
    var tmp = timestring.split(":");
    return (tmp[0]-0)*3600 + (tmp[1]-0)*60 + (tmp[2]-0);
}

function getTimeString(secondValue){
    var hours = Math.floor(secondValue/3600);
    if(hours < 10){ hours = "0"+hours; }
    var minutes = Math.floor((secondValue - hours*3600)/60);
    if(minutes < 10){ minutes = "0"+minutes; }
    var seconds = Math.round(secondValue - minutes*60 - hours*3600);
    if(seconds < 10){ seconds = "0"+seconds; }
    return hours + ":" + minutes + ":" + seconds;
    
}

var displayDataConfig = {
    showMarkers: false,
    showPath: true,
    drawBoundingBox: false,
    clearFirst: false
};

var markers = [], mbr = null;
function displayTrajectoryData(trajectoryData, config, bounds, domElementToColor) {
    
    
    if(config === null || config === undefined){
        config = displayDataConfig;
    }
    
    if(bounds === null || bounds === undefined){
        bounds = new google.maps.LatLngBounds();
    }
    
    //convert data points to LatLng objects
    var latLngs = [];
    for (var i = 0; i<trajectoryData.length ; i++){
        latLngs.push(new google.maps.LatLng(trajectoryData[i][0], trajectoryData[i][1]));
        bounds.extend(latLngs[i]);
    }
    
    // latLngs & bounds ready
    
    if (config.clearFirst === true) {
        for (var i = 0; i < trajectoryPolys.length; i++) {
            trajectoryPolys[i].setMap(null);
        }
        trajectoryPolys = [];
        
        // clear markers
        for (i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
            markers[i] = null;
        }
        markers = [];
        
        
    }
    
    if(config.showPath){
        // new path polyLine with random color
        var colorIdx = Math.round(Math.random() * (availableColors.length - 1));
        polyOptions.strokeColor = availableColors[colorIdx];
        if(domElementToColor !== undefined){
            domElementToColor.style.background = availableColors[colorIdx];
        }
        availableColors.splice(colorIdx, 1);
        
        var pathIdx = Math.round(Math.random() * (availablePaths.length - 1));
        polyOptions.icons = [{
            icon: {
                path: availablePaths[pathIdx],
                fillOpacity: 1
            },
            offset: '0%'
        }];
        
        var poly = new google.maps.Polyline(polyOptions);
        poly.setMap(mapObject);
        var path = poly.getPath();
        for(i in latLngs){
            path.push(latLngs[i]);
        }
        trajectoryPolys.push(poly);
    }
    
    
    mapObject.fitBounds(bounds);
    return bounds;
}