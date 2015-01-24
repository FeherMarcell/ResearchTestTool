// <editor-fold desc="mapStyle and mapOptions" defaultstate="collapsed">
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
    }, {featureType: "administrative.country", elementType: "all", stylers: [{visibility: "on"}]}
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

var trajectoryColors = ["#B23C00", "#FFC108", "#FF0000", "#07CC2A", "#9BB205", "#276EB2", "#FF46BC", "#13FFEE", "#2500CC", "#9300B2"];
//var trajectoryColors = ["black", "black"];
//var trajectoryColors = ["white", "white", "white", "white"];
var polyPaths = [google.maps.SymbolPath.CIRCLE, "M -1,-1 1,1 M 1,-1 -1,1", "M -1,-1 -1,1 1,1 1,-1 z", "M -1,0 0,-1 1,0 0,1 z"];
var polyPaths = ["M -1,-1 1,1 M 1,-1 -1,1", "M -1,0 0,-1 1,0 0,1 z"];
var polyOptions = {
    strokeOpacity: 1,
    strokeWeight: 3,
    zIndex: 10
            /*
             ,icons: [{
             icon: {
             path: "M -1,-1 -1,1 1,1 1,-1 z",
             fillOpacity: 1
             },
             repeat: '30px'
             }]
             */

};

var mapObject = {};
//</editor-fold>

var trajectoryData = [], trajectory2Data = [];
var trajectoryPolys = [];
var dataFiles = [];
var availableColors = [];
var availablePaths = [];
var displayDataConfig = {
    showMarkers: true,
    showPath: true,
    drawBoundingBox: false,
    clearFirst: false
};

var similarityData = null;
var gridPolys = [];
var gridCells = [];

// Define a symbol using SVG path notation, with an opacity of 1.
var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: .4,
    scale: 2.5
};

$(document).ready(function() {
    mapObject = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    google.maps.event.addListener(mapObject, 'rightclick', function(event) {
        console.log("X: " + event.latLng.lng());
        console.log("Y: " + event.latLng.lat());
        console.log("");
        /*
         var infowindow = new google.maps.InfoWindow({
         content: event.latLng.B + "," + event.latLng.k
         });
         */
    });

    $("#loadRandomPair").on("click", function() {
        $.get("php/controller.php", {command: "getRandomPair"}, function(data) {
            
            $("#traj_1").val(data.path1.replace("sampleDataCleaned", "sampleData"));
            $("#traj_2").val(data.path2.replace("sampleDataCleaned", "sampleData"));
            $("#gridSize").val(data.gridSize);

            $("#load2Given").trigger("click");
            $("#showGrid").trigger("click");

        }, "json");
    });

    $("#loadRandomTrajectories").on("click", function() {
        $.post(
                "php/controller.php",
                {command: "getRandoms", trajectoriesCount: $("#trajectoriesNum").val(), gridSizeMeters: $("#gridSize").val(), whichGrid: $('input:radio[name=whichGrid]:checked').val()},
        function(data) {
            availableColors = jQuery.extend(true, [], trajectoryColors);
            availablePaths = jQuery.extend(true, [], polyPaths);
            var bounds = null;
            for (var idx in data) {
                bounds = displayTrajectoryData(data[idx], displayDataConfig, bounds);
            }
            mapObject.fitBounds(bounds);
        }, "json");
    });

    $("#loadRandom").click(function() {
        $.get(
                "php/getRandomTrajectory.php",
                function(data) {
                    log("Data file: " + data.dataFile + " (" + data.data.length + " points)");
                    dataFiles.push(data.dataFile);
                    trajectoryData = data.data;
                    availableColors = jQuery.extend(true, [], trajectoryColors);
                    availablePaths = jQuery.extend(true, [], polyPaths);
                    displayTrajectoryData(data.data, displayDataConfig);
                    $(".parameterBox").slideDown();
                },
                "json"
                );
    });

    $("#loadRandomAndNormalize").click(function() {
        $.get(
                "php/getRandomTrajectory.php",
                function(data) {
                    trajectoryData = data;
                    availableColors = jQuery.extend(true, [], trajectoryColors);
                    availablePaths = jQuery.extend(true, [], polyPaths);
                    displayTrajectoryData(trajectoryData, displayDataConfig);
                    $(".parameterBox").slideDown();
                    normalizeAndShow(trajectoryData, displayDataConfig);
                },
                "json"
                );
    });

    function normalizeAndShow(trajectory, displayDataConfig) {
        // normalize trajectory
        var trajectoryLength = trajectory.length;
        var meanLat = 0, meanLon = 0;
        for (var idx in trajectory) {
            meanLat += trajectory[idx][0] - 0;
            meanLon += trajectory[idx][1] - 0;
        }
        meanLat /= trajectoryLength;
        meanLon /= trajectoryLength;

        // calculate std deviations
        var devLat = 0, devLon = 0;
        var sqDiffLat = 0, sqDiffLon = 0;
        for (idx in trajectory) {
            sqDiffLat += Math.pow(trajectory[idx][0] - meanLat, 2);
            sqDiffLon += Math.pow(trajectory[idx][1] - meanLon, 2);
        }
        devLat = Math.sqrt(sqDiffLat / trajectoryLength);
        devLon = Math.sqrt(sqDiffLon / trajectoryLength);

        console.log("Std. deviation latitude: " + devLat);
        console.log("Std. deviation longitude: " + devLon);
        // normalize trajectory
        for (idx in trajectory) {
            trajectory[idx] = [(trajectory[idx][0] - meanLat) / devLat, (trajectory[idx][1] - meanLon) / devLon];
        }

        displayTrajectoryData(trajectory, displayDataConfig);
    }

    $("#load2Given").click(function() {
        $("#dataPreview").html("");
        $.post(
                "php/controller.php",
                {command: "getGivenTrajectories", trajectory1: $("#traj_1").val(), trajectory2: $("#traj_2").val()},
        function(data) {

            availableColors = jQuery.extend(true, [], trajectoryColors);
            availablePaths = jQuery.extend(true, [], polyPaths);
            commonBounds = displayTrajectoryData(data.data[0], displayDataConfig, null, document.getElementById("traj_1_color"));
            displayDataConfig.clearFirst = false;
            displayTrajectoryData(data.data[1], displayDataConfig, commonBounds, document.getElementById("traj_2_color"));
            displayDataConfig.clearFirst = true;
            //console.log("bounds:");
            //console.log(commonBounds);
        },
                "json"
                );
    });

    $("#load2Randoms").click(function() {
        $("#dataPreview").html("");
        var commonBounds = new google.maps.LatLngBounds();
        $.get(
                "php/getRandomTrajectory.php",
                function(data) {
                    clearGrid();
                    log("Data file #1: " + data.dataFile + " (" + data.data.length + " points)");
                    dataFiles.push(data.dataFile);
                    $("#traj_1").val(data.dataFile);
                    //trajectoryData = data.data;
                    displayDataConfig.clearFirst = true;
                    availableColors = jQuery.extend(true, [], trajectoryColors);
                    availablePaths = jQuery.extend(true, [], polyPaths);
                    commonBounds = displayTrajectoryData(data.data, displayDataConfig, null, document.getElementById("traj_1_color"));
                    //$(".parameterBox").slideDown();

                    $.get(
                            "php/getRandomTrajectory.php",
                            function(data) {
                                log("Data file #2: " + data.dataFile + " (" + data.data.length + " points)");
                                dataFiles.push(data.dataFile);
                                $("#traj_2").val(data.dataFile);
                                //trajectory2Data = data.data;
                                displayDataConfig.clearFirst = false;
                                commonBounds = displayTrajectoryData(data.data, displayDataConfig, commonBounds, document.getElementById("traj_2_color"));
                                mapObject.fitBounds(commonBounds);
                                $(".parameterBox").slideDown();

                                showGrid(commonBounds, 500);
                            },
                            "json"
                            );
                },
                "json"
                );

    });

    $("#startAnglecut").click(function() {
        $.post(
                "php/controller.php",
                {command: "angleCut", filePath: dataFiles[dataFiles.length - 1], minAngle: $("#minAngle").val()},
        function(compressedTrajectoryData) {
            log("Angle cut with " + $("#minAngle").val() + " min angle finished.");
            log("Size of compressed trajectory: " + compressedTrajectoryData.length);
            trajectoryData = compressedTrajectoryData;
            availableColors = jQuery.extend(true, [], trajectoryColors);
            availablePaths = jQuery.extend(true, [], polyPaths);
            displayTrajectoryData(false, true);
        },
                "json"
                );
    });

    $("#startDouglasPeucker").click(function() {
        $.post(
                "php/controller.php",
                {command: "douglasPeucker", data: trajectoryData, tolerance: $("#tolerance").val()},
        function(compressedTrajectoryData) {
            log("Douglas-Peucker with " + $("#tolerance").val() + " max distance finished.");
            log("Size of compressed trajectory: " + compressedTrajectoryData.length);
            trajectoryData = compressedTrajectoryData;
            availableColors = jQuery.extend(true, [], trajectoryColors);
            availablePaths = jQuery.extend(true, [], polyPaths);
            displayTrajectoryData(false, true);
        },
                "json"
                );
    });

    $("input[name=whichGrid]").on("change", function() {
        drawGrid();
    });

    var rectangleFillColors = {
        main: "#ff0000",
        secondary: "#0000ff",
        merged: "#00ff00"
    };

    function drawGrid() {
        console.log("drawGrid");
        console.log(similarityData);
        
        // which grid to draw
        var maxRow = 0, maxCol = 0;


        // clear 
        for (var idx in gridPolys) {
            gridPolys[idx].setMap(null);
            delete gridPolys[idx];
        }
        for (idx in gridCells) {
            gridCells[idx].setMap(null);
            delete gridCells[idx];
        }

        var grid, gridCorners, cellSize;
        var drawGrid = true;

        
        var fillColor = "";
        
        switch ($("input[name=whichGrid]:checked").val() - 0) {
            case 0: // secondary
                grid = similarityData.grids.secondary;
                gridCorners = similarityData.gridCorners.secondary;
                cellSize = similarityData.cellSize;
                fillColor = rectangleFillColors.secondary;
                break;
            case 1: // main
                grid = similarityData.grids.main;
                gridCorners = similarityData.gridCorners.main;
                cellSize = similarityData.cellSize;
                fillColor = rectangleFillColors.main;
                break;
            case 2:  // merged
                drawGrid = false;

                grid = similarityData.grids.merged;
                gridCorners = similarityData.gridCorners.main;
                cellSize = [similarityData.cellSize[0] / 2, similarityData.cellSize[1] / 2];

                // fill overlapping cells
                for (var idx in similarityData.stats.cells) {
                    gridCells.push(new google.maps.Rectangle({
                        map: mapObject,
                        fillColor: rectangleFillColors.merged,
                        fillOpacity: .3,
                        strokeWeight: 0,
                        bounds: new google.maps.LatLngBounds(
                                // sw
                                new google.maps.LatLng(
                                        gridCorners[0] + (cellSize[0] * similarityData.stats.cells[idx][1]),
                                        gridCorners[1] + (cellSize[1] * similarityData.stats.cells[idx][0])
                                        ),
                                // ne
                                new google.maps.LatLng(
                                        gridCorners[0] + (cellSize[0] * (similarityData.stats.cells[idx][1] + 1)),
                                        gridCorners[1] + (cellSize[1] * (similarityData.stats.cells[idx][0] + 1))
                                        )
                                )
                    }));
                }

                break;
            default: // none
                drawGrid = false;
                break;
        }

        
        if (!drawGrid ) {
            return;
        }
        
        // calculate max row and max col
        for (var idx in grid) {
            if (grid[idx][0] > maxRow) {
                maxRow = grid[idx][0];
            }
            if (grid[idx][1] > maxCol) {
                maxCol = grid[idx][1];
            }
        }


        // draw horizontal dashed lines
        for (var colIdx = 0; colIdx <= maxCol + 1; colIdx++) {
            gridPolys.push(new google.maps.Polyline({
                path: [
                    new google.maps.LatLng(
                            gridCorners[0] + colIdx * cellSize[0],
                            gridCorners[1]),
                    new google.maps.LatLng(
                            gridCorners[0] + colIdx * cellSize[0],
                            gridCorners[1] + (maxRow + 1) * cellSize[1])
                ],
                strokeColor: "#000000",
                strokeWidth: 1,
                strokeOpacity: 0,
                icons: [{
                        icon: lineSymbol,
                        offset: '5px',
                        repeat: '15px'
                    }],
                map: mapObject
            }));
        }
        
        // draw vertical dashed lines
        for (var rowIdx = 0; rowIdx <= maxRow + 1; rowIdx++) {
            gridPolys.push(new google.maps.Polyline({
                path: [
                    new google.maps.LatLng(
                            gridCorners[0],
                            gridCorners[1] + rowIdx * cellSize[1]
                            ),
                    new google.maps.LatLng(
                            gridCorners[0] + (maxCol + 1) * cellSize[0],
                            gridCorners[1] + rowIdx * cellSize[1]
                            )
                ],
                strokeColor: "#000000",
                strokeWidth: 1,
                strokeOpacity: 0,
                icons: [{
                        icon: lineSymbol,
                        offset: '5px',
                        repeat: '15px'
                    }],
                map: mapObject
            }));
        }


        // draw filled rectangles
        if(gridCorners.length > 0){
            for (var idx in grid) {
                gridCells.push(new google.maps.Rectangle({
                    map: mapObject,
                    fillColor: fillColor,
                    fillOpacity: .3,
                    strokeWeight: 0,
                    bounds: new google.maps.LatLngBounds(
                            // sw
                            new google.maps.LatLng(
                                    gridCorners[0] + (cellSize[0] * grid[idx][1]),
                                    gridCorners[1] + (cellSize[1] * grid[idx][0])
                                    ),
                            // ne
                            new google.maps.LatLng(
                                    gridCorners[0] + (cellSize[0] * (grid[idx][1] + 1)),
                                    gridCorners[1] + (cellSize[1] * (grid[idx][0] + 1))
                                    )
                            )
                }));
            }
        }
    }

    $("#showGrid").click(function() {
        var bounds;
        var commonBounds = null;

        $.post("php/controller.php", {command: "getSimilarity", trajectory1: $("#traj_1").val(), trajectory2: $("#traj_2").val(), gridSize: $("#gridSize").val(), withGrid: true},
        function(result) {
            $("#log").html("Similarity: " + (result.similarity * 100).toFixed(2) + "%\nMarked cells: " + result.stats.allCells + "\nOverlapping cells: " + result.stats.overlappingCells);
            similarityData = result;
            drawGrid();

        }, "json");



        return;

        $.post(
                "php/controller.php",
                {command: "getGrid", trajectory1: $("#traj_1").val(), trajectory2: $("#traj_2").val(), gridSizeMeters: $("#gridSize").val(), whichGrid: $('input:radio[name=whichGrid]:checked').val()},
        function(data) {

            clearGrid();
            if (data.stats !== undefined) {
                $("#log").html("COMMON distance: " + data.stats.common.commonCellsNum + "/" + data.stats.common.allCellsNum + " = <b>" + data.stats.common.similarity + "</b>");
                $("#log").append("\nPRIMARY: " + data.stats.primary.commonCellsNum + "/" + data.stats.primary.allCellsNum + " = " + data.stats.primary.similarity);
                $("#log").append("\nSECONDARY: " + data.stats.secondary.commonCellsNum + "/" + data.stats.secondary.allCellsNum + " = " + data.stats.secondary.similarity);
            }
            var gridCellFillColor = "#067325";

            console.log("getGrid info:");
            for (var idx in data.info) {
                console.log(data.info[idx]);
            }
            //console.log("GRID:"); console.log(data.common_grid);

            drawGridFromCoords(data.gridCoords);
            if (data.stats === undefined) {
                return;
            }


            var fillColor = "", strokeColor = "#000000";

            var overlayBg = "http://www.stripegenerator.com/generators/generate_stripes.php?fore=000000&h=30&w=40&p=40&back1=ffffff&back2=ff0000&gt=0&d=0&shadow=0&";
            var overlayConfig = {opacity: .5, map: mapObject};

            for (var idx in data.common_grid) {
                break;
                bounds = new google.maps.LatLngBounds(
                        new google.maps.LatLng(data.common_grid[idx].bounds.southWest.lat, data.common_grid[idx].bounds.southWest.lng),
                        new google.maps.LatLng(data.common_grid[idx].bounds.northEast.lat, data.common_grid[idx].bounds.northEast.lng)
                        );
                if (commonBounds === null) {
                    commonBounds = jQuery.extend(null, {}, bounds);
                }
                else {
                    commonBounds.union(bounds);
                }
                //gridLines.push(new google.maps.GroundOverlay(overlayBg, bounds, overlayConfig));



                gridLines.push(new google.maps.Rectangle({
                    strokeWidth: 0,
                    strokeOpactiy: 0.3,
                    fillColor: gridCellFillColor,
                    fillOpacity: .3,
                    map: mapObject,
                    bounds: bounds,
                    zIndex: 0
                }));



                /*
                 gridLines.push(new google.maps.Marker({
                 map: mapObject,
                 position: bounds.getCenter(),
                 title: data.common_grid[idx].info
                 }));
                 */
            }
            //mapObject.fitBounds(commonBounds);
            //return;

            //Draw usual gridcells
            var gridBounds = null, bounds = null;
            for (var latIdx in data.grid) {
                for (var lonIdx in data.grid[latIdx]) {
                    if (data.grid[latIdx][lonIdx].crossingTrajectoryIds.length > 0) {
                        //szinezni kell

                        var inFirst = false;
                        var inSecond = false;

                        if (data.grid[latIdx][lonIdx].crossingTrajectoryIds.indexOf(0) !== -1) {
                            // 0. trajectory (is)
                            fillColor = gridCellFillColor;
                            strokeColor = "#ffffff";
                            inFirst = true;
                            overlayBg = "http://www.stripegenerator.com/generators/generate_stripes.php?fore=000000&h=30&w=20&p=20&back1=ffffff&back2=ff0000&gt=0&d=1&shadow=0&";
                        }
                        if (data.grid[latIdx][lonIdx].crossingTrajectoryIds.indexOf(1) !== -1) {
                            // 1. trajectory (is)
                            fillColor = gridCellFillColor;
                            strokeColor = "#000000";
                            inSecond = true;
                            overlayBg = "http://www.stripegenerator.com/generators/generate_stripes.php?fore=000000&h=30&w=20&p=20&back1=ffffff&back2=ff0000&gt=0&d=0&shadow=0&";
                        }

                        if (inFirst && inSecond) {
                            fillColor = gridCellFillColor;
                        }
                        /*
                         gridLines.push(new google.maps.GroundOverlay(
                         overlayBg,
                         new google.maps.LatLngBounds(
                         new google.maps.LatLng(data.grid[latIdx][lonIdx].bounds.southWest.lat, data.grid[latIdx][lonIdx].bounds.southWest.lng),
                         new google.maps.LatLng(data.grid[latIdx][lonIdx].bounds.northEast.lat, data.grid[latIdx][lonIdx].bounds.northEast.lng)
                         ),
                         overlayConfig));
                         
                         */
                        bounds = new google.maps.LatLngBounds(
                                new google.maps.LatLng(data.grid[latIdx][lonIdx].bounds.southWest.lat, data.grid[latIdx][lonIdx].bounds.southWest.lng),
                                new google.maps.LatLng(data.grid[latIdx][lonIdx].bounds.northEast.lat, data.grid[latIdx][lonIdx].bounds.northEast.lng)
                                )

                        gridLines.push(new google.maps.Rectangle({
                            strokeWidth: 0,
                            strokeOpacity: .3,
                            strokeColor: strokeColor,
                            fillColor: fillColor,
                            fillOpacity: .2,
                            map: mapObject,
                            zIndex: 0,
                            bounds: bounds
                        }));

                        if (gridBounds === null) {
                            gridBounds = jQuery.extend(null, {}, bounds);
                        }
                        else {
                            gridBounds.union(bounds);
                        }


                    }
                }
            }
            mapObject.fitBounds(gridBounds);


            // draw markers
            /*
             for(var latIdx in data.grid){
             for(var lonIdx in data.grid[latIdx]){
             gridLines.push(new google.maps.Marker({
             position: new google.maps.LatLng(data.grid[latIdx][lonIdx].northEast.lat, data.grid[latIdx][lonIdx].northEast.lng),
             title: latIdx + ", " + lonIdx,
             map: mapObject
             }));
             gridLines.push(new google.maps.Marker({
             position: new google.maps.LatLng(data.grid[latIdx][lonIdx].southWest.lat, data.grid[latIdx][lonIdx].southWest.lng),
             title: latIdx + ", " + lonIdx,
             map: mapObject
             }));
             }
             }
             */
        },
                "json"
                );
    });

    // save trajectory paths to localstorage
    $("#traj_1").on("change", function() {
        localStorage.setItem("trajectory1", $(this).val());
    });
    $("#traj_2").on("change", function() {
        localStorage.setItem("trajectory2", $(this).val());
    });

    // load back
    if (localStorage.getItem("trajectory1") !== null) {
        $("#traj_1").val(localStorage.getItem("trajectory1"));
    }
    if (localStorage.getItem("trajectory2") !== null) {
        $("#traj_2").val(localStorage.getItem("trajectory2"));
    }

    $("#newMarker").on("click", function() {
        gridLines.push(new google.maps.Marker({
            map: mapObject,
            position: new google.maps.LatLng($("#newMarkerLat").val(), $("#newMarkerLon").val())
        }));
    });
});

var gridLines = [];

function drawGridFromCoords(coords) {
    clearGrid();

    for (var latIdx in coords.lat) {
        gridLines.push(new google.maps.Polyline({
            path: [
                new google.maps.LatLng(coords.lat[latIdx], coords.lon[0]),
                new google.maps.LatLng(coords.lat[latIdx], coords.lon[ coords.lon.length - 1 ])
            ],
            strokeColor: '#000000',
            strokeOpacity: .4,
            map: mapObject
        }));
    }
    for (var lonIdx in coords.lon) {
        gridLines.push(new google.maps.Polyline({
            path: [
                new google.maps.LatLng(coords.lat[0], coords.lon[lonIdx]),
                new google.maps.LatLng(coords.lat[coords.lat.length - 1], coords.lon[lonIdx])
            ],
            strokeColor: '#000000',
            strokeOpacity: .4,
            map: mapObject
        }));
    }
}

function clearGrid() {
    for (i = 0; i < gridLines.length; i++) {
        gridLines[i].setMap(null);
        gridLines[i] = null;
    }
    gridLines = [];
}

function showGrid(bounds, gridSizeMeters) {

    clearGrid();

    console.log("bounds:");
    console.log(bounds);
    var avgLatitude = (bounds.getNorthEast().lat() + Math.abs(bounds.getSouthWest().lat())) / 2;
    //var degreesDiff = getDegreeDiffAtLatitude(gridSizeMeters, maxLatitude);
    //console.log(gridSizeMeters + " meters diff is " + degreesDiff + " lat diff at max latitude " + avgLatitude);

    // vizszintes vonalak (konstans longitude)
    var currentLat = bounds.getNorthEast().lat();
    while (currentLat >= bounds.getSouthWest().lat()) {

        var currentLine = new google.maps.Polyline({
            path: [
                new google.maps.LatLng(currentLat, bounds.getNorthEast().lng()),
                new google.maps.LatLng(currentLat, bounds.getSouthWest().lng())
            ],
            geodesic: true,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 1,
            label: "Latitude: " + currentLat,
            map: mapObject
        });
        /*
         console.log("current line: ");
         console.log("["+currentLat+", "+bounds.getNorthEast().lng()+"]");
         console.log("["+currentLat+", "+bounds.getSouthWest().lng()+"]");
         */

        gridLines.push(currentLine);
        currentLat -= ((gridSizeMeters / 1000) / 6378) * (180 / Math.PI);
    }
    var currentLine = new google.maps.Polyline({
        path: [
            new google.maps.LatLng(currentLat, bounds.getNorthEast().lng()),
            new google.maps.LatLng(currentLat, bounds.getSouthWest().lng())
        ],
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 1,
        label: "Latitude: " + currentLat
    });
    /*
     console.log("current line: ");
     console.log("["+currentLat+", "+bounds.getNorthEast().lng()+"]");
     console.log("["+currentLat+", "+bounds.getSouthWest().lng()+"]");
     */
    currentLine.setMap(mapObject);
    gridLines.push(currentLine);

    // fuggoleges vonalak (konstans latitude)
    var currentLon = bounds.getNorthEast().lng();
    // change degreeDiff to latitude degree diff
    //degreesDiff = getLatDegreeDiffAtLatitude(gridSizeMeters, maxLatitude);
    //console.log(gridSizeMeters + " meters diff is " + degreesDiff + " lon diff at max latitude " + maxLatitude);

    while (currentLon >= bounds.getSouthWest().lng()) {
        //currentLon = bounds.getNorthEast().lng() - (i*degreesDiff);

        var currentLine = new google.maps.Polyline({
            path: [
                new google.maps.LatLng(bounds.getNorthEast().lat(), currentLon),
                new google.maps.LatLng(bounds.getSouthWest().lat(), currentLon)
            ],
            geodesic: true,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 1,
            label: "Longitude: " + currentLon
        });
        /*
         console.log("current line: ");
         console.log("["+currentLat+", "+bounds.getNorthEast().lng()+"]");
         console.log("["+currentLat+", "+bounds.getSouthWest().lng()+"]");
         */
        currentLine.setMap(mapObject);
        gridLines.push(currentLine);
        currentLon -= ((gridSizeMeters / 1000) / 6378) * (180 / Math.PI) / Math.cos(toRad(avgLatitude));
    }
    var currentLine = new google.maps.Polyline({
        path: [
            new google.maps.LatLng(bounds.getNorthEast().lat(), currentLon),
            new google.maps.LatLng(bounds.getSouthWest().lat(), currentLon)
        ],
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 1,
        label: "Longitude: " + currentLon
    });
    /*
     console.log("current line: ");
     console.log("["+currentLat+", "+bounds.getNorthEast().lng()+"]");
     console.log("["+currentLat+", "+bounds.getSouthWest().lng()+"]");
     */
    currentLine.setMap(mapObject);
    gridLines.push(currentLine);
    currentLon -= ((gridSizeMeters / 1000) / 6378) * (180 / Math.PI) / Math.cos(toRad(avgLatitude));

}


var markers = [], mbr = null;
function displayTrajectoryData(trajectoryData, config, bounds, domElementToColor) {
    //drawBoundingBox = false;

    if (bounds === null || bounds === undefined) {
        bounds = new google.maps.LatLngBounds();
    }

    //convert data points to LatLng objects
    var latLngs = [];
    for (var i = 0; i < trajectoryData.length; i++) {
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

    if (config.showPath) {
        // new path polyLine with random color
        var colorIdx = Math.round(Math.random() * (availableColors.length - 1));
        polyOptions.strokeColor = availableColors[colorIdx];
        if (domElementToColor !== undefined) {
            domElementToColor.style.background = availableColors[colorIdx];
        }
        availableColors.splice(colorIdx, 1);

        // and random icon
        var pathIdx = Math.round(Math.random() * (availablePaths.length - 1));
        //console.log("paths: "); console.log(availablePaths);
        //console.log("selected: " + pathIdx + ": " + availablePaths[pathIdx]);
        /*
         polyOptions.icons = [{
         icon: {
         path: availablePaths[pathIdx],
         fillOpacity: 1
         },
         repeat: '30px'
         }];
         */

        availableColors.splice(pathIdx, 1);
        //console.log("paths after deleting "+pathIdx+": "); console.log(availablePaths);

        var poly = new google.maps.Polyline(polyOptions);
        poly.setMap(mapObject);
        var path = poly.getPath();
        for (i in latLngs) {
            path.push(latLngs[i]);
        }
        trajectoryPolys.push(poly);
    }

    if (config.showMarkers) {
        for (i in latLngs) {
            markers.push(new google.maps.Marker({
                position: latLngs[i],
                title: '#' + i,
                map: mapObject,
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    color: "white",
                    scale: 2.5
                }
            }));
        }
    }



    if (config.drawBoundingBox === true) {
        if (mbr !== null) {
            mbr.setMap(null);
        }

        mbr = new google.maps.Rectangle({
            map: mapObject,
            bounds: bounds,
            strokeColor: '#000',
            strokeWidth: 3
        });

        //console.log(bounds.getSouthWest());

        var sw = new google.maps.LatLng(bounds.getSouthWest().lat() - 0.01, bounds.getSouthWest().lng() - 0.01);
        var ne = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);


        new google.maps.Rectangle({
            map: mapObject,
            bounds: new google.maps.LatLngBounds(
                    sw,
                    ne
                    ),
            strokeColor: '#ff0000',
            strokeWidth: 2
        });
    }


    mapObject.fitBounds(bounds);
    return bounds;
}

function log(msg) {
    if (document.getElementById("dataPreview").style.display === "none") {
        $("#dataPreview").slideDown();
    }

    $("#dataPreview").append(msg + "<br>");
}

function getDegreeDiffAtLatitude(meterDiff, latitude) {
    return meterDiff / (Math.cos((latitude * Math.PI) / 180.0) * 111194.9266);
}

function getLatDegreeDiffAtLatitude(meterDiff, lat) {
    var p1 = 111412.84;		// longitude calculation term 1
    var p2 = -93.5;			// longitude calculation term 2
    var p3 = 0.118;			// longitude calculation term 3

    return meterDiff / ((p1 * Math.cos(toRad(lat))) + (p2 * Math.cos(3 * toRad(lat))) + (p3 * Math.cos(5 * toRad(lat))));
}

function toRad(num) {
    return num * Math.PI / 180.0;
}

