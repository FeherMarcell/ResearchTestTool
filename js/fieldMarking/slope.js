
var bw = 400;
var bh = 400;
var p = 40;

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
context.fillStyle="#EBEBEB";


var xCanvas = document.getElementById("xNumbers");
var xContext = xCanvas.getContext("2d");
// draw the index numbers
xContext.font = "15px Arial";
xContext.textAlign = "center";
for(var i = 1 ; i < bh/p ; i++){
	xContext.fillText(i*p, i*p ,30);
	xContext.fillText(i, i*p + (p/2) ,12);
}

var startPoint = [0,0], endPoint = [0,0];
var startPointSet = false;




canvas.addEventListener("click", function(element){
	//console.log(element);
	if(!startPointSet){

		// clean canvas
		resetCanvas();

		startPoint = [element.offsetX, element.offsetY];
		//startPoint = [0, 200];
                
		context.beginPath();
		context.arc(element.offsetX, element.offsetY, 5, 0, 2 * Math.PI);
		context.fillStyle = "#C42929"; // red
		context.fill();
		//console.log("start point:"); console.log(startPoint);

		startPointSet = true;


	}
	else{
		endPoint = [element.offsetX, element.offsetY];
		//endPoint = [200, 320];
                
		context.beginPath();
		context.arc(element.offsetX, element.offsetY, 5, 0, 2 * Math.PI);
		context.fillStyle = "#139C2C"; // green
		context.fill();

		context.beginPath();
		context.moveTo(startPoint[0], startPoint[1]);
		context.lineTo(endPoint[0], endPoint[1]);
		context.strokeStyle = "#19B2E6";
		context.lineWidth = 2;
		context.stroke();

		startPointSet = false;

		markPoints();
	}

});

function markPoints(){

	// switch start & endPoint if startX > endX
	if(startPoint[0] > endPoint[0]){
		var tmp = startPoint;
		startPoint = endPoint;
		endPoint = tmp;
	}

	var startPointCoords = [Math.floor(startPoint[0] / p), Math.floor(startPoint[1] / p)];
	var endPointCoords = [Math.floor(endPoint[0] / p), Math.floor(endPoint[1] / p)];

	/*
	 * Border cases
	 */
	// Vertical line, constant X coord
	if(startPointCoords[0] === endPointCoords[0]){
		// set smaller to be the start, larger to be the end
		var startY = (startPointCoords[1] > endPointCoords[1]) ? endPointCoords[1] : startPointCoords[1];
		var endY = (startPointCoords[1] < endPointCoords[1]) ? endPointCoords[1] : startPointCoords[1];
		for(startY ; startY<=endY ; startY++){
			fillField([startPointCoords[0], startY]);
		}
		return;
	}
	// Horizontal line, constant Y coord
	if(startPointCoords[1] === endPointCoords[1]){
		var startX = (startPointCoords[0] > endPointCoords[0]) ? endPointCoords[0] : startPointCoords[0];
		var endX = (startPointCoords[0] < endPointCoords[0]) ? endPointCoords[0] : startPointCoords[0];
		for(startX ; startX<=endX ; startX++){
			fillField([startX, startPointCoords[1]]);
		}
		return;
	}

	// non-border case

	/*
	http://stackoverflow.com/questions/3233522/elegant-clean-special-case-straight-line-grid-traversal-algorithm

	@inproceedings{amanatides1987fast,
	  title={A fast voxel traversal algorithm for ray tracing},
	  author={Amanatides, John and Woo, Andrew and others},
	  booktitle={Proceedings of EUROGRAPHICS},
	  volume={87},
	  pages={3--10},
	  year={1987}
	}

	1. Given two points A and B, determine the intersection points of the line (A, B) with every vertical line of Your grid, that lies within this interval.
	2. Insert two special intersection points inside the cells containing A and B at the start/end of the list from point 1
	3. Interpret every two sequent intersection points as the min and max vectors of a axis aligned rectangle and mark all grid cells that
	   lie inside this rectangle (this is very easy (intersection of two axis aligned rects), especially considering, that the rectangle has a
	   width of 1 and therefore occupies only 1 column of Your grid)

		+------+------+------+------+
		|      |      |      |      |
		|      |      | B    *      |
		|      |      |/     |      |
		+------+------*------+------+
		|      |     /|      |      |
		|      |    / |      |      |
		|      |   /  |      |      |
		+------+--/---+------+------+
		|      | /    |      |      |
		|      |/     |      |      |
		|      *      |      |      |
		+-----/+------+------+------+
		|    / |      |      |      |
		*   A  |      |      |      |
		|      |      |      |      |
		+------+------+------+------+

	*/

	var dx = endPoint[0] - startPoint[0];
	var dy = endPoint[1] - startPoint[1];
	var slope = dy / dx;

	//console.log("dx: " + dx + ", dy: " + dy + ", abs(dx): " + Math.abs(dx));
	//console.log("X shift: " + sign(dx));
	//console.log("Y shift: " + sign(dy));

	console.log("slope: " + slope);

	var helperPoints = [];

	// first special point
	helperPoints.push([
		startPointCoords[0]*p,
		startPoint[1]
		]);

	// loop all vertical lines between startPoint and endPoint

	// calculate smaller and larger X
	var startXCoord = startPointCoords[0];
	var endXCoord = endPointCoords[0];

	for(startXCoord ; startXCoord <= endXCoord ; startXCoord++){
		console.log("startX: " + startXCoord);

		var currentDx = (startXCoord + 1)*p - startPoint[0];
		var y = (slope * currentDx) + startPoint[1];

		// mark the cells of current rectangle
		var previousYCoord = Math.floor(helperPoints[helperPoints.length - 1][1]/p);
		
                var currentYCoord = (startXCoord === endXCoord) ? (Math.floor(endPoint[1]/p)) : Math.floor(y / p);

		// flip previousY and currentY if current > prev
		if(currentYCoord > previousYCoord){
			var tmp = currentYCoord;
			currentYCoord = previousYCoord;
			previousYCoord = tmp;
		}

		console.log("Y index range: " + currentYCoord + " -> " + previousYCoord);

		for(currentYCoord ; currentYCoord <= previousYCoord ; currentYCoord++){
			fillField([startXCoord, currentYCoord]);
		}
		
                if(startXCoord === endXCoord){
                    // last special point
                    helperPoints.push([
                        (endPointCoords[0]+1)*p,
                        endPoint[1]
                        ]);
                }
                else{
                    helperPoints.push([
			(startXCoord+1)*p,
			y
			]);
                }
                
                
                console.log("");
		
	}
        /*
	// mark the cells of current rectangle
        
	var previousYCoord = Math.floor(helperPoints[helperPoints.length - 1][1]/p);
	var currentYCoord = Math.floor(endPoint[1]/p);
	

	// flip previousY and currentY if current > prev
	if(currentYCoord > previousYCoord){
		var tmp = currentYCoord;
		currentYCoord = previousYCoord;
		previousYCoord = tmp;
	}
        console.log("prev Y: " + previousYCoord + ", current Y: " + currentYCoord);
	for(currentYCoord ; currentYCoord <= previousYCoord ; currentYCoord++){
		fillField([endXCoord, currentYCoord]);
	}
	// last special point
	helperPoints.push([
		(endPointCoords[0]+1)*p,
		endPoint[1]
		]);

        */
        
	// draw all helper points
	for(var idx in helperPoints){
		drawHelperCircle(helperPoints[idx][0], helperPoints[idx][1]);
	}
}

function drawHelperCircle(x,y){
	context.beginPath();
	context.arc(x,y,5,0, 2 * Math.PI);
	context.fillStyle = "#A64AD4"; // purple
	context.fill();
}

function sign(x) {
    return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function fillField(fieldArr){
	//console.log("fillField"); console.log(fieldArr);
	context.beginPath();
	context.fillStyle = "rgba(209,27,103,0.3)";
	context.fillRect(fieldArr[0]*p, fieldArr[1]*p, p, p);
}



resetCanvas();


function drawBoard(){
	context.beginPath();
	for(var x = 0 ; x <= bw ; x+= p){
		context.moveTo(x, 0);
		context.lineTo(x, bh)
	}

	for(var y = 0 ; y <= bh ; y+= p){
		context.moveTo(0, y);
		context.lineTo(bw, y)
	}

	context.lineWidth = 1;
	context.strokeStyle = "black";
	context.stroke();
}

function resetCanvas(){
	//console.log("resetting canvas");

	context.clearRect(0,0,canvas.width, canvas.height);

	//context.save();
	//context.fillRect(0,0,bw,bh);
	//context.moveTo(0, 0);
	//context.lineTo(canvas.width, canvas.height);
	//context.stroke();

	drawBoard();
	//context.restore();

}
