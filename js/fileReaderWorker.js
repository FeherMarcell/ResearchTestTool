self.addEventListener("message", function(event) {
    var reader = new FileReaderSync();
    // szetbontjuk sorokra es ugy adjuk vissza tombkent
    var rows = reader.readAsText(event.data).split("\n");
    
    var returnDTO = {
        geoPoints: []
    };
    
    var dataRowIndex = 6; // elso adatot tartalmazo sor indexe
    var rowParts = [];
    for(dataRowIndex ; dataRowIndex < rows.length ; dataRowIndex++){
        if(rows[dataRowIndex] === "")
            continue;
        rowParts = rows[dataRowIndex].split(",");
        returnDTO.geoPoints.push([rowParts[0], rowParts[1]]);
    }
    postMessage(returnDTO);
}, false);
