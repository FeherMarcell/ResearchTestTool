"use strict";



function FekutController(google) {

    var self = this;
    
    
    
    // inject google (maps needs it)
    self.google = google;
    // default tolerance of the algorithm in meters
    self.tolerance = 50;

    // eredeti adathalmaz
    var originalDataRows = [];


    //<editor-fold defaultstate="collapsed" desc="File reader">
    var fileReaderWorker = new Worker("js/fileReaderWorker.js");
    fileReaderWorker.onmessage = function(message) {
        //fileRows = message.data;
        originalDataRows = message.data;
        self.onFileReadReady();
    };
    fileReaderWorker.onerror = function() {
        self.showError("Nem sikerült beolvasni a fájlt", "loadError");
    };


    /**
     * Uj file kitallozasa vagy drop eseten lefuto esemenykezelo
     * 
     * @param {Object} event A file kivalasztas vagy drop esemeny
     * @returns {undefined} Nem ad vissza semmit
     */
    self.newFileSelectedOrDropped = function(event) {
        console.log("new file");

        // megallitjuk az esemeny tovabbadasat
        self.dragNoop(event);
        var files;

        if (event.dataTransfer) {
            // drop eseten
            files = event.dataTransfer.files;
        }
        else {
            // tallozas eseten
            files = event.target.files;
        }

        if (files.length > 0) {
            // ha volt legalabb 1 file, akkor WebWorker-el beolvassuk az elso file tartalmat
            fileReaderWorker.postMessage(files[0]);
        }
        else {
            // nem file volt, nincs ertelme beolvasni
            self.showError("Nem sikerült beolvasni a fájlt", "loadError");
        }
    };

    //</editor-fold>

    var originalPath = new self.google.maps.Polyline({
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        icons: [{
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                },
                repeat: '10%'
            }]
    });

    var compressedPath = new self.google.maps.Polyline({
        strokeColor: '#0000FF',
        strokeOpacity: 1.0,
        strokeWeight: 3
    });

    var compressedMarkers = [];
    var originalMarkers = [];
    self.onFileReadReady = function() {
        console.log("onFileReadReady");

        $("#parameterBox").slideDown();

        $("#dataPreview").slideUp();
        /*
         console.log("Data:");
         console.log(originalDataRows);
         */

        // clear map
        clearMap();

        // move map to the first position
        mapObject.setCenter(new self.google.maps.LatLng(originalDataRows.geoPoints[0][0], originalDataRows.geoPoints[0][1]))

        // create polyLine Map layer of original points

        var path = originalPath.getPath();
        var latLng, marker;

        for (var idx = 0; idx < originalDataRows.geoPoints.length; idx++) {
            //console.log(originalDataRows.geoPoints[idx]);
            latLng = new self.google.maps.LatLng(originalDataRows.geoPoints[idx][0], originalDataRows.geoPoints[idx][1]);
            path.push(latLng);
        }

        $("#dataPreview").html("Size of original route: " + originalDataRows.geoPoints.length + " points<hr/>");
        $("#dataPreview").slideDown();
    };
    
    // <editor-fold defaultstate="collapsed" desc="Map options, style, empty mapObject, initializeMap()">
    var mapStyle = [
        {
            stylers: [
                {hue: "#996e13"},
                {saturation: -20}
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
        mapTypeId: self.google.maps.MapTypeId.ROADMAP,
        center: new self.google.maps.LatLng(39.996948, 116.325747),
        styles: mapStyle,
        scaleControl: true,
        scaleControlOptions: {position: self.google.maps.ControlPosition.BOTTOM_LEFT}
    };
    var mapObject = {};
    
    self.initializeMap = function() {
        mapObject = new self.google.maps.Map(document.getElementById("map_canvas"), mapOptions);
        originalPath.setMap(mapObject);
        compressedPath.setMap(mapObject);
    };
    //</editor-fold>

    
    function clearMap() {
        // clear original path
        originalPath.setMap(null);
        originalPath = new self.google.maps.Polyline({
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 3/*,
             icons: [{
             icon: {
             path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
             },
             repeat: '10%'
             }]
             */
        });
        originalPath.setMap(mapObject);
        for (var idx in originalMarkers) {
            originalMarkers[idx].setMap(null);
            originalMarkers[idx] = null;
        }
        originalMarkers = [];
        clearCompressedPath();
    }
    function clearCompressedPath() {
        compressedPath.setMap(null);
        compressedPath = new self.google.maps.Polyline({
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 3
        });
        compressedPath.setMap(mapObject);
        for (var idx in compressedMarkers) {
            compressedMarkers[idx].setMap(null);
            compressedMarkers[idx] = null;
        }
        compressedMarkers = [];

    }
    

    // <editor-fold defaultstate="collapsed" desc="douglasPeuckerWorker and related functions">
    /*
    var douglasPeuckerWorker = new Worker("js/douglasPeuckerWorker.js");
    self.startDouglasPeucker = function() {
        console.log("startDouglasPeucker inputs: ");

        var douglasPeuckerInputs = {
            geoPoints: originalDataRows.geoPoints,
            tolerance: self.tolerance,
            toleranceMeters: self.tolerance * 10 * 1000,
            //1000 because self.tolerance is microdegrees
            whichCondidition: "meters",
            minTolerance: $("#minTolerance").val()
            
        };
        console.log(douglasPeuckerInputs);

        clearCompressedPath();

        console.time('douglasPeuckerWorker');
        douglasPeuckerWorker.postMessage(douglasPeuckerInputs);
    };
    douglasPeuckerWorker.onmessage = function(message) {

        if (!message.data.hasOwnProperty("geoPoints")) {
            $("#dataPreview").append("\n" + message.data);
            return;
        }

        console.timeEnd('douglasPeuckerWorker');

        console.log("douglasPeuckerWorker data message:");
        console.log(message.data);

        $("#dataPreview").append("\nSize of compressed route: " + message.data.geoPoints.length + " points (" + new Number((message.data.geoPoints.length / originalDataRows.geoPoints.length) * 100).toPrecision(2) + "%)");
        $("#dataPreview").append("\nAVG distance: " + new Number(message.data.avgDistance * 1000).toPrecision(4) + " GPS microdegrees");
        $("#dataPreview").append("\nMax distance: " + new Number(message.data.maxDistance * 1000).toPrecision(4) + " GPS microdegrees");
        $("#dataPreview").append("\nAVG distance: " + new Number(message.data.avgDistanceMeters * 1000).toPrecision(4) + " meters");
        $("#dataPreview").append("\nMax distance: " + new Number(message.data.maxDistanceMeters * 1000).toPrecision(4) + " meters");
        $("#dataPreview").append("<hr/>");

        return;

        var latLng;
        var path = compressedPath.getPath();
        for (var idx in message.data.geoPoints) {
            latLng = new self.google.maps.LatLng(message.data.geoPoints[idx][0], message.data.geoPoints[idx][1]);
            path.push(latLng);

            compressedMarkers.push(new google.maps.Marker({
                position: latLng,
                title: '#' + idx,
                map: mapObject,
                icon: {
                    path: self.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 4
                }
            }));

        }

    };
    douglasPeuckerWorker.onerror = function(e) {
        self.showError("Failed to run Douglas-Peucker algorithm!", "loadError");
        console.log(e);
    };
    */
    // </editor-fold>


    var dynamicDPWorker = new Worker('js/dynamicDP.js');
    dynamicDPWorker.onerror = function(e) {
        self.showError("Failed to run dynamic Douglas-Peucker algorithm!", "loadError");
        $("#dataPreview").append("\n<span style='color: red'>Error while compressing: " + e.message + "</span>");
        console.log(e);
    };
    self.startDynamicDP = function(inputs) {
        
        console.log("Dynamic DP inputs:");
        console.log(inputs);
        
        if(inputs === undefined){
            // started from the UI
            inputs = {
                geoPoints: originalDataRows.geoPoints,
                maxDistance: $("#tolerance").val(),
                distanceMeasure: $("input[name=distanceMeasure]:checked").val()
            };
            clearCompressedPath();
            console.time('dynamicDPWorker');
        }
        // else started from batch and 'inputs' object is passed
        
        dynamicDPWorker.postMessage(inputs);
        return;
    };
    dynamicDPWorker.onmessage = function(message) {
        
        if(message.data.hasOwnProperty("fromBatch")){
            
            /*
             * statistics = {
        clientType: "Chrome " + navigator.appVersion,
        pointsNum: 0,
        reducedPointsNum: 0,
        userFolder: "",
        dataFileName: "",
        maxDistance: 0.0,
        reductionBasedOn: "meters",
        stepsDP: 0,
        stepsDistanceCalculation: 0,
        retryCount: 0,
        totalTimeMS: 0.0,
        distanceCalcTimeMS: 0.0,
        geoPoints: []
    };
             */
            
            
            if(message.data.wasError === true){
                // don't upload results
                console.log("WASERROR");
                dynamicDpReturnedFromBatch(statistics.geoPoints);
                return;
            }
            
            statistics.reducedPointsNum = message.data.reducedPointsNum;
            statistics.stepsDP = message.data.stepsDP;
            statistics.stepsDistanceCalculation = message.data.stepsDistanceCalculation;
            statistics.retryCount = message.data.retryCount;
            statistics.totalTimeMS = message.data.totalTimeMS;
            statistics.distanceCalcTimeMS = message.data.distanceCalcTimeMS;
            
            statistics.maxDistance = currentDpInputs.maxDistance;
            statistics.reductionBasedOn = currentDpInputs.distanceMeasure;
            
            
            var geoPointsCache = [];
            /*
            for(var idx in statistics.geoPoints){
                geoPointsCache.push(statistics.geoPoints[idx]);
            }
            */
            //statistics.geoPoints = [];  // reset before sending
            
            $.post("saveStats.php", statistics, function(){
                dynamicDpReturnedFromBatch(geoPointsCache);
                return;
            }).error(function(error){
                $("#dataPreview").append("<span style='color: red'>"+error.message+"</span>");
                console.log(error);
                // start with new config
                dynamicDpReturnedFromBatch(geoPointsCache);
                return;
            });
            return;
        }
        
        // <editor-fold defaultstate="collapsed" desc="display results on the map & console">
        if (!message.data.hasOwnProperty("compressedPath")) {
            $("#dataPreview").append("\n" + message.data);
            console.log(message.data);
            return;
        }
        console.timeEnd('dynamicDPWorker');

        console.log("dynamicDP data message:");
        console.log(message.data);

        $("#dataPreview").append("\nCompressed size: " + message.data.compressedPath.length);
        $("#dataPreview").append(" (<span style='color: green'>"+new Number((message.data.compressedPath.length / originalDataRows.geoPoints.length) * 100).toPrecision(2)+"%</span>)");
        //$("#dataPreview").append("\nMax distance: " + new Number(message.data.distancesInMeters).toPrecision(4) + " meters");
        //$("#dataPreview").append("\nAVG distance: " + new Number(message.data.avgDistance).toPrecision(4) + " meters");
        $("#dataPreview").append("<hr/>");


        // show compressed path with markers
        var latLng;
        var path = compressedPath.getPath();
        for (var idx in message.data.compressedPath) {
            latLng = new self.google.maps.LatLng(message.data.compressedPath[idx][0], message.data.compressedPath[idx][1]);
            path.push(latLng);

            compressedMarkers.push(new google.maps.Marker({
                position: latLng,
                title: '#' + idx,
                map: mapObject,
                icon: {
                    path: self.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: 4
                }
            }));
        }

        
        if (message.data.hasOwnProperty("maxDistanceIndex")) {
            // show the biggest distance point with a marker
            originalMarkers.push(new self.google.maps.Marker({
                position: new self.google.maps.LatLng(originalDataRows.geoPoints[message.data.maxDistanceIndex][0], originalDataRows.geoPoints[message.data.maxDistanceIndex][1]),
                title: '#' + message.data.maxDistanceIndex,
                map: mapObject
            }));
        }

        if (message.data.hasOwnProperty("maxDistanceLineStart") && message.data.hasOwnProperty("maxDistanceLineEnd")) {
            // show line start and end on the original path too
            originalMarkers.push(new self.google.maps.Marker({
                position: new self.google.maps.LatLng(message.data.maxDistanceLineStart[0], message.data.maxDistanceLineStart[1]),
                title: 'Line start',
                map: mapObject
            }));
            originalMarkers.push(new self.google.maps.Marker({
                position: new self.google.maps.LatLng(message.data.maxDistanceLineEnd[0], message.data.maxDistanceLineEnd[1]),
                title: 'Line end',
                map: mapObject
            }));
        }
        // </editor-fold>
    };

    function dynamicDpReturnedFromBatch(geoPointsCache){
        // increase config idx
        currentConfigIdx++;
        
        if(currentConfigIdx >= allDifferentConfigs.length){
            // all configs have been ran on this file
            
            // reset currentConfigIdx
            currentConfigIdx = 0;
            // load the next file
            currentBatchFileIdx++;
            
            self.processNextDatafile();
        }
        else{
            // not done with all configs, a new round will be started
            
            // load new configs
            currentDpInputs.maxDistance = allDifferentConfigs[currentConfigIdx].maxDistance;
            currentDpInputs.distanceMeasure = allDifferentConfigs[currentConfigIdx].reductionBasedOn;
            
            // load back geopoints
            
            //currentDpInputs.geoPoints = [];
            /*
            for(var idx in geoPointsCache){
                currentDpInputs.geoPoints.push(geoPointsCache[idx]);
            }
            */
            //console.log("geoPointsCache:"); console.log(currentDpInputs.geoPoints); return;
            // start dynamicDP with new config
            self.startDynamicDP(currentDpInputs);
        }
    }

    self.isBatchSimulation = false;
    self.batchFiles = [];
    self.startBatchSimulation = function(){
        // Batch Simulation is started
        self.isBatchSimulation = true;
        
        batchStartTime = Date.now();
        
        // change GUI
        $("#measurementBox").hide();
        $("#dropFile").hide();
        $("#dataPreview").slideDown();
        
        // download file list
        $.get("fileList", function(data){
            //console.log(data);
            for(var userFolder in data){
                for(var file in data[userFolder]){
                    self.batchFiles.push(userFolder+"/Trajectory/"+data[userFolder][file]);
                }
            }
            
            //trim the list
            self.batchFiles.splice(100, self.batchFiles.length-100);
            // notify file list is ready
            self.processNextDatafile();
        }, "json");
            
    };
    
    var currentBatchFileIdx = 0;
    var dataRowIndex = 6; // elso adatot tartalmazo sor indexe
    var rows = [], rowParts = [];
    var statistics = {
        clientType: getBrowserAndVersion(),
        pointsNum: 0,
        reducedPointsNum: 0,
        userFolder: "",
        dataFileName: "",
        maxDistance: 0.0,
        reductionBasedOn: "meters",
        stepsDP: 0,
        stepsDistanceCalculation: 0,
        retryCount: 0,
        totalTimeMS: 0.0,
        distanceCalcTimeMS: 0.0,
        geoPoints: []
    };
    var batchCalculationTolerations = [10, 25, 50, 100]; // in meters
    var batchCalculationDistancemeasures = ["meters", "degrees"];
    
    var allDifferentConfigs = [];
    getAllConfigs();
    function getAllConfigs(){
        for(var aaa in batchCalculationTolerations){
            for(var bbb in batchCalculationDistancemeasures){
                allDifferentConfigs.push({
                    reductionBasedOn: batchCalculationDistancemeasures[bbb],
                    maxDistance: batchCalculationTolerations[aaa],
                    finished: false
                });
            }
        }
    }
    var currentConfigIdx = 0;
    var currentDpInputs = {geoPoints: [], maxDistance: 0.0, distanceMeasure: "", isBatch: true};
    var batchStartTime = 0.0;
    
    self.processNextDatafile = function(){
        
        var d = new Date();
        // over-indexing = we are finished
        if(self.batchFiles.length === currentBatchFileIdx){
            // finish
            $("#dataPreview").prepend("<hr/>["+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"] Batch process finished in "+((Date.now()-batchStartTime)/1000)+"s");
            return;
        }
        
        statistics.dataFileName = self.batchFiles[currentBatchFileIdx];
        
        console.log("downloading file: " + statistics.dataFileName);
        
        $.get("sampleData/" + statistics.dataFileName, 
        
            function(dataText){
                statistics.geoPoints = [];
                dataRowIndex = 6;
                // parse file
                rows = dataText.split("\n");
                for(dataRowIndex ; dataRowIndex < rows.length ; dataRowIndex++){
                    if(rows[dataRowIndex] === "")
                        continue;
                    rowParts = rows[dataRowIndex].split(",");
                    statistics.geoPoints.push([rowParts[0], rowParts[1]]);
                }
                
                statistics.pointsNum = statistics.geoPoints.length;
                
                // load config (always zero when this is called)
                statistics.maxDistance = allDifferentConfigs[currentConfigIdx].maxDistance;
                statistics.reductionBasedOn = allDifferentConfigs[currentConfigIdx].reductionBasedOn;
                
                $("#dataPreview").prepend("\n["+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"] Starting processing file #"+(currentBatchFileIdx+1)+":\n"+statistics.dataFileName);
                currentDpInputs = {
                    geoPoints: statistics.geoPoints,
                    maxDistance: statistics.maxDistance,
                    distanceMeasure: statistics.reductionBasedOn,
                    isBatch: true
                };
                self.startDynamicDP(currentDpInputs);
            });
    };
    
    function getBrowserAndVersion(){
        var tmp = navigator.userAgent.split(" ");
        for(var idx in tmp){
            if(tmp[idx].search("Chrome")>=0 || tmp[idx].search("MSIE")>=0 || tmp[idx].search("Firefox")>=0)
                return tmp[idx];
        }
        return "Unknown: " + navigator.userAgent;
    }
    

    // hibauzenet megjelenitese
    self.showError = function(str, elementId) {
        $("#" + elementId + " strong").html(str);
        $("#" + elementId).slideDown().delay(2000).slideUp();
    };

    self.toggleDetails = function() {
        $("#fekDetails").slideToggle();
    };

// drag-el kapcsolatos esemenykezelok megfogjak az esemenyt 
// hogy ne toltodjon be a file a webalkalmazas helyen
// semmilyen lenyegi funkcionalitast nem nyujt
    self.dragNoop = function(evt) {

        evt.stopPropagation();
        evt.preventDefault();

        // drop zone kinezet valtas ha epp folotte tartanak egy fajlt
        if (evt.type === "dragover" || evt.type === "dragenter") {
            $("#dropFile").addClass("dropZoneDragover");
            $("#dropFile").html("Release data file now!");
        }
        else {
            $("#dropFile").removeClass("dropZoneDragover");
            $("#dropFile").html("Drop data file here");
        }
    };

    var plot = null;
    self.showPlot = function(plotData) {
        $("#plotBox").slideDown();
        // plot
        plot = null;
        $("#chart").html("");
        // initialize data
        /*
        var plotData = [];
        for (var i = 0; i < dataRows.length; i++) {
            plotData.push(parseFloat(dataRows[i][SPEED_COL]));
        }
        */
       
       //var maxValue = plotData.data.meters[(plotData.data.meters.length-1)][0];
        console.log("PlotData:"); console.log(plotData.data["meters"]); console.log(plotData.data["degrees"]);
        //plotData = {"meters":[["5","0"],["5","1"],["5","1"],["5","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","1"],["7","0"],["7","1"],["12","0"],["12","0"],["12","0"],["12","0"],["21","0"],["21","1"],["21","1"],["21","4"],["21","0"],["21","0"],["21","1"],["21","0"],["25","1"],["25","0"],["25","1"],["25","0"],["27","1"],["27","0"],["27","0"],["27","0"],["32","1"],["32","1"],["32","1"],["32","0"],["43","1"],["43","0"],["43","1"],["43","0"],["47","1"],["47","1"],["47","1"],["47","1"],["50","2"],["50","1"],["50","1"],["50","1"],["51","2"],["51","2"],["51","2"],["51","2"],["55","6"],["55","2"],["55","1"],["55","1"],["79","4"],["79","4"],["79","5"],["79","4"],["81","5"],["81","2"],["81","2"],["81","2"],["81","4"],["81","1"],["81","1"],["81","2"],["85","3"],["85","3"],["85","3"],["85","2"],["87","4"],["87","2"],["87","1"],["87","1"],["88","4"],["88","4"],["88","3"],["88","3"],["95","32"],["95","5"],["95","5"],["95","3"],["96","5"],["96","8"],["96","4"],["96","3"],["98","4"],["98","3"],["98","3"],["98","4"],["119","4"],["119","5"],["119","5"],["119","4"],["121","7"],["121","8"],["121","4"],["121","3"],["129","7"],["129","5"],["129","5"],["129","4"],["132","6"],["132","6"],["132","5"],["132","4"],["133","6"],["133","5"],["133","4"],["133","4"],["133","8"],["133","7"],["133","9"],["133","6"],["145","7"],["145","9"],["145","6"],["145","2"],["146","8"],["146","7"],["146","6"],["146","5"],["152","10"],["152","10"],["152","10"],["152","7"],["152","9"],["152","12"],["152","8"],["152","9"],["166","8"],["166","8"],["166","8"],["166","8"],["173","9"],["173","7"],["173","8"],["173","8"],["178","9"],["178","13"],["178","12"],["178","9"],["182","16"],["182","2"],["182","1"],["182","1"],["183","10"],["183","11"],["183","5"],["183","4"],["186","10"],["186","9"],["186","10"],["186","6"],["195","15"],["195","10"],["195","12"],["195","9"],["201","10"],["201","10"],["201","9"],["201","7"],["222","13"],["222","15"],["222","11"],["222","11"],["244","15"],["244","12"],["244","14"],["244","5"],["254","15"],["254","14"],["254","14"],["254","13"],["272","20"],["272","21"],["272","18"],["272","14"],["279","17"],["279","15"],["279","22"],["279","12"],["279","20"],["279","15"],["279","13"],["279","4"],["281","22"],["281","20"],["281","16"],["281","13"],["285","16"],["285","17"],["285","11"],["285","12"],["305","21"],["305","21"],["305","19"],["305","15"],["307","27"],["307","24"],["307","24"],["307","26"],["314","21"],["314","14"],["314","9"],["314","9"],["337","24"],["337","20"],["337","22"],["337","20"],["338","21"],["338","20"],["338","17"],["338","15"],["355","24"],["355","20"],["355","16"],["355","13"],["419","26"],["419","26"],["419","26"],["419","27"],["460","31"],["460","28"],["460","28"],["460","19"],["461","26"],["461","29"],["461","28"],["461","20"],["494","45"],["494","34"],["494","28"],["494","22"],["540","45"],["540","49"],["540","35"],["540","31"],["583","53"],["583","38"],["583","37"],["583","28"],["665","67"],["665","49"],["665","56"],["665","37"],["681","57"],["681","46"],["681","41"],["681","40"],["693","51"],["693","42"],["693","51"],["693","35"],["722","55"],["722","55"],["722","63"],["722","45"],["745","61"],["745","47"],["745","48"],["745","47"],["817","75"],["817","48"],["817","43"],["817","31"],["898","80"],["898","75"],["898","69"],["898","62"],["908","89"],["908","68"],["908","57"],["908","51"],["979","64"],["979","70"],["979","62"],["1007","85"],["1007","74"],["1007","63"],["1007","65"],["1080","98"],["1080","75"],["1080","84"],["1080","72"],["1084","110"],["1084","86"],["1084","76"],["1084","75"],["1140","76"],["1140","85"],["1140","93"],["1140","69"],["1208","124"],["1208","86"],["1208","81"],["1208","70"],["1266","130"],["1266","92"],["1266","83"],["1266","78"],["1328","126"],["1328","104"],["1328","103"],["1328","102"],["1450","122"],["1450","110"],["1450","83"],["1450","74"],["1477","134"],["1477","113"],["1477","75"],["1477","62"],["1477","139"],["1477","102"],["1477","96"],["1477","73"],["1754","134"],["1754","132"],["1754","131"],["1754","116"],["1819","150"],["1819","151"],["1819","121"],["1819","122"],["1886","170"],["1886","142"],["1886","128"],["1886","121"],["1936","168"],["1936","145"],["1936","134"],["1936","126"],["2079","191"],["2079","167"],["2079","147"],["2079","128"],["2231","229"],["2231","172"],["2231","157"],["2231","144"],["2238","193"],["2238","161"],["2238","150"],["2238","148"],["2239","204"],["2239","171"],["2239","162"],["2239","159"],["2321","207"],["2321","180"],["2321","173"],["2321","163"],["2359","205"],["2359","190"],["2359","160"],["2359","149"],["2505","227"],["2505","187"],["2505","179"],["2505","183"],["2844","259"],["2844","210"],["2844","209"],["2844","202"],["2958","291"],["2958","239"],["2958","217"],["2958","196"],["3119","278"],["3119","220"],["3119","229"],["3119","211"],["3321","328"],["3321","262"],["3321","256"],["3321","242"],["3670","323"],["3670","268"],["3670","242"],["3670","217"],["4004","287"],["4004","270"],["14186","1651"],["14186","1540"],["14186","1359"],["14186","1212"]],"degrees":[["5","0"],["5","0"],["5","0"],["5","1"],["7","0"],["7","0"],["7","0"],["7","0"],["7","1"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","0"],["7","1"],["12","0"],["12","0"],["12","0"],["12","0"],["21","1"],["21","0"],["21","0"],["21","1"],["21","1"],["21","1"],["21","1"],["21","1"],["25","0"],["25","0"],["25","0"],["25","0"],["27","0"],["27","1"],["27","0"],["27","0"],["32","1"],["32","0"],["32","0"],["32","1"],["43","1"],["43","0"],["43","0"],["43","0"],["47","1"],["47","1"],["47","0"],["47","1"],["50","2"],["50","2"],["50","2"],["50","1"],["51","2"],["51","2"],["51","2"],["51","1"],["55","2"],["55","2"],["55","1"],["55","1"],["79","3"],["79","4"],["79","3"],["79","3"],["81","3"],["81","3"],["81","2"],["81","1"],["81","3"],["81","3"],["81","1"],["81","1"],["85","2"],["85","2"],["85","4"],["85","3"],["87","3"],["87","2"],["87","1"],["87","1"],["88","3"],["88","2"],["88","2"],["88","2"],["95","4"],["95","4"],["95","3"],["95","2"],["96","4"],["96","4"],["96","3"],["96","6"],["98","4"],["98","2"],["98","3"],["98","3"],["119","3"],["119","3"],["119","3"],["119","3"],["121","5"],["121","4"],["121","6"],["121","4"],["129","5"],["129","5"],["129","6"],["129","3"],["132","5"],["132","4"],["132","4"],["132","4"],["133","5"],["133","4"],["133","3"],["133","3"],["133","7"],["133","4"],["133","5"],["133","4"],["145","5"],["145","4"],["145","7"],["145","3"],["146","6"],["146","5"],["146","4"],["146","3"],["152","10"],["152","6"],["152","7"],["152","6"],["152","8"],["152","6"],["152","6"],["152","5"],["166","6"],["166","6"],["166","6"],["166","5"],["173","11"],["173","4"],["173","6"],["173","6"],["178","7"],["178","7"],["178","7"],["178","8"],["182","9"],["182","6"],["182","1"],["182","1"],["183","10"],["183","7"],["183","4"],["183","4"],["186","8"],["186","10"],["186","7"],["186","6"],["195","8"],["195","6"],["195","6"],["195","8"],["201","8"],["201","8"],["201","6"],["201","5"],["222","12"],["222","9"],["222","9"],["222","8"],["244","12"],["244","10"],["244","12"],["244","3"],["254","15"],["254","10"],["254","12"],["254","9"],["272","16"],["272","19"],["272","16"],["272","16"],["279","14"],["279","10"],["279","11"],["279","9"],["279","14"],["279","12"],["279","10"],["279","8"],["281","16"],["281","13"],["281","11"],["281","10"],["285","10"],["285","11"],["285","9"],["285","9"],["305","15"],["305","14"],["305","15"],["305","12"],["307","20"],["307","18"],["307","16"],["307","14"],["314","13"],["314","14"],["314","7"],["314","5"],["337","15"],["337","16"],["337","14"],["337","18"],["338","17"],["338","13"],["338","12"],["338","11"],["355","18"],["355","17"],["355","12"],["355","8"],["419","19"],["419","23"],["419","18"],["419","16"],["460","22"],["460","20"],["460","20"],["460","15"],["461","21"],["461","17"],["461","18"],["461","19"],["494","25"],["494","26"],["494","20"],["494","16"],["540","32"],["540","29"],["540","24"],["540","21"],["583","29"],["583","27"],["583","26"],["583","23"],["665","49"],["665","38"],["665","35"],["665","26"],["681","43"],["681","31"],["681","27"],["681","29"],["693","40"],["693","31"],["693","29"],["693","26"],["722","36"],["722","42"],["722","47"],["722","40"],["745","39"],["745","35"],["745","41"],["745","31"],["817","41"],["817","39"],["817","31"],["817","23"],["898","58"],["898","46"],["898","47"],["898","46"],["908","59"],["908","54"],["908","42"],["908","36"],["979","47"],["979","49"],["979","42"],["1007","71"],["1007","56"],["1007","47"],["1007","46"],["1080","71"],["1080","64"],["1080","61"],["1080","55"],["1084","66"],["1084","62"],["1084","56"],["1084","57"],["1140","67"],["1140","56"],["1140","58"],["1140","51"],["1208","65"],["1208","70"],["1208","56"],["1208","50"],["1266","88"],["1266","63"],["1266","64"],["1266","57"],["1328","87"],["1328","84"],["1328","78"],["1328","73"],["1450","92"],["1450","79"],["1450","59"],["1450","51"],["1477","87"],["1477","79"],["1477","62"],["1477","43"],["1477","82"],["1477","80"],["1477","72"],["1477","62"],["1754","102"],["1754","99"],["1754","95"],["1754","88"],["1819","118"],["1819","99"],["1819","95"],["1819","94"],["1886","121"],["1886","106"],["1886","96"],["1886","95"],["1936","133"],["1936","109"],["1936","99"],["1936","98"],["2079","143"],["2079","115"],["2079","113"],["2079","105"],["2231","126"],["2231","132"],["2231","112"],["2231","110"],["2238","137"],["2238","121"],["2238","120"],["2238","114"],["2239","141"],["2239","128"],["2239","124"],["2239","121"],["2321","150"],["2321","129"],["2321","123"],["2321","127"],["2359","151"],["2359","132"],["2359","119"],["2359","120"],["2505","162"],["2505","148"],["2505","128"],["2505","130"],["2844","173"],["2844","158"],["2844","150"],["2844","156"],["2958","198"],["2958","174"],["2958","161"],["2958","152"],["3119","207"],["3119","176"],["3119","169"],["3119","163"],["3321","235"],["3321","201"],["3321","196"],["3321","186"],["3670","240"],["3670","197"],["3670","184"],["3670","171"],["4004","200"],["14186","1253"],["14186","1173"],["14186","1051"],["14186","937"]]};
        plot = $.jqplot('chart', [plotData.data["meters"], plotData.data["degrees"]], {
            // Give the plot a title.
            title: 'Runtime difference',
            // You can specify options for all axes on the plot at once with
            // the axesDefaults object.  Here, we're using a canvas renderer
            // to draw the axis label which allows rotated text.
            
            seriesDefaults: {
                showMarker: true
            },
            series: [
                {
                    markerOptions: { style: 'x' }
                },
                {
                    markerOptions: { style: 'circle' }
                }
            ],
                
            
            
            // An axes object holds options for all axes.
            // Allowable axes are xaxis, x2axis, yaxis, y2axis, y3axis, ...
            // Up to 9 y axes are supported.
            axes: {
                // options for each axis are specified in seperate option objects.
                xaxis: {
                    label: "Original dataset size"
                    // Turn off "padding".  This will allow data point to lie on the
                    // edges of the grid.  Default padding is 1.2 and will keep all
                    // points inside the bounds of the grid.
                    //pad: 1.2
                    /*
                    min:0,
                    max: plotData.data.meters[(plotData.data.meters.length-1)][0]*1.1
                    */
                },
                yaxis: {
                    label: "Reduction time (ms)"
                    /*
                    min:-10,
                    max: plotData.maxTime,
                    pad: 1.2
                    */
                }
            },
             cursor:{ 
        show: true,
        zoom:true, 
        showTooltip:false
      } 
        });
    };

    return self;
}

var controller;

function onPageLoad() {

    controller = new FekutController(google);
    controller.initializeMap();

    // esemenykezelok (jQuery-bol bekotve nem mukodnek)
    document.getElementById("dropFile").addEventListener("dragenter", controller.dragNoop, false);
    document.getElementById("dropFile").addEventListener("dragexit", controller.dragNoop, false);
    document.getElementById("dropFile").addEventListener("dragleave", controller.dragNoop, false);
    document.getElementById("dropFile").addEventListener("dragover", controller.dragNoop, false);
    // drop
    document.getElementById("dropFile").addEventListener("drop", controller.newFileSelectedOrDropped, false);
    // tallozas
    // document.getElementById("dataFile").addEventListener("change", controller.newFileSelectedOrDropped, false);
}

//google.maps.event.addDomListener(window, 'load', onPageLoad);


$(document).ready(function() {
    onPageLoad();

    if (!Modernizr.webworkers) {
        alert("Please use a HTML5-compliant browser instead of this shit. We recommend Google Chrome.");
        return;
    }

    $("#clearLogBtn").click(function() {
        $("#dataPreview").html("<br>");
    });

    /*
     // sebesseg slider init + esemenykezelok
     $("#toleranceSlider").slider({
     range: false,
     min: 0.001,
     max: 500,
     values: [1],
     step: 0.01,
     slide: function(event, ui) {
     $("#tolerance").val(ui.values[0]);
     },
     change: function(event, ui) {
     controller.tolerance = ui.values[0] / 1000;
     // ujraszamoljuk a fekezeseket
     }
     });
     // sebessegeket kezzel beirva a slider-en is valtozzanak az ertekek
     /*
     $("#tolerance").keyup(function() {
     $("#toleranceSlider").slider("values", 0, $(this).val());
     });
     */

    $("#startDouglasPeucker").click(function() {
        //controller.startDouglasPeucker();
        controller.startDynamicDP();
    });

        /*
     var distancesWorker = new Worker('js/distancesCheck.js');
        $("#calcDistDiff").click(function(){
        distancesWorker.postMessage("");
     });
     
     distancesWorker.onmessage = function(message){
        $("#distDiff").append(message.data + "\n");
     };
     */
     
     $("#startBatchSimulation").click(function(){
         controller.startBatchSimulation();
     });
     
     $("#showPlot").click(function(){
         // get data
         $.get("getData.php", function(data){
            controller.showPlot(data);
         }, "json");
         
     });

});
