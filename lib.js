/*
A small, simple javascript library for game making, currently dosent support sound.
has drawing functions for most shapes and input handing
*/

var canvas = document.getElementById("main");
canvas.setAttribute('draggable', false);

var c = canvas.getContext("2d");
document.addEventListener('contextmenu', event => event.preventDefault());

function converttxttoArray(filename) {
    var reader = (window.XMLHttpRequest != null) 
                 ? new XMLHttpRequest() 
                 : new ActiveXObject("Microsoft.XMLHTTP");
    reader.open("GET", filename, false);
    reader.onload = function() {
        let output = [];
        let res = this.responseText.split('\n');
        res.forEach(line => {
            if(line.length > 0){
                output.push(line);
            }
        })
        return output
    }
    reader.send();
    return reader.onload();
}

const windowW = canvas.width;
const windowH = canvas.height;

let gamepads = {};
window.addEventListener(
    "gamepadconnected",
    (e) => {
      gamepadHandler(e, true);
    },
    false
  );
  window.addEventListener(
    "gamepaddisconnected",
    (e) => {
      gamepadHandler(e, false);
    },
    false
  );
function gamepadHandler(e,connect){
    gamepad = e.gamepad;
    if(connect){
        gamepads[gamepad.index] = gamepad;
    }else{
        delete gamepads[gamepad.index];
    }
}

let Camera = {scale:1,position:[0,0],target:[0,0],speed:0.1}

var mouse = {x: 0, y: 0, scroll:0,oldx: 0, oldy: 0, button: {left: false, middle: false, right: false}};

var oldMouseDelta = {x:0,y:0}

this.canvas.addEventListener('wheel',function(event){
    
    mouse.scroll = event
    event.preventDefault();
}, false);

canvas.addEventListener('mousemove', function(evt) {
    mouse.oldx = mouse.x
    mouse.oldy = mouse.y
    mouse.x = evt.clientX - canvas.getBoundingClientRect().left;
    mouse.y = evt.clientY - canvas.getBoundingClientRect().top;
}, false);

canvas.addEventListener('mousedown', function(event){
    switch (event.button) {
        case 0:
            mouse.button.left = true;
            break;
        case 1:
            mouse.button.middle = true;
            break;
        case 2:
            mouse.button.right = true;
            break;
    }
});

canvas.addEventListener('mouseup', function(event){
    switch (event.button) {
        case 0:
            mouse.button.left = false;
            break;
        case 1:
            mouse.button.middle = false;
            break;
        case 2:
            mouse.button.right = false;
            break;
    }
});

let keys = {};
let oldKeys = {};
let keyCodeConversion = {}
document.addEventListener('keydown', function(event) {
    keys[event.code] = true;
    keyCodeConversion[event.code] = event.key;
});
document.addEventListener('keyup', function(event) {
    keys[event.code] = false;
});

function checkKey(key){
    return key in keys && keys[key];
}
function keyPressed(key){
    if(checkKey(key) && !(key in oldKeys && oldKeys[key])){
        return true;
    }else{
        return false;
    }
}

function blendCols(col1, col2, per){
    var R = col1[0] + (col2[0] - col1[0])*per;
    var G = col1[1] + (col2[1] - col1[1])*per;
    var B = col1[2] + (col2[2] - col1[2])*per;
    return [R, G, B];
}


function midPoint(point1, point2, per){
    var x = point1[0] + (point2[0] - point1[0])*per;
    var y = point1[1] + (point2[1] - point1[1])*per;
    return [x, y];
}

function onScreen(X, Y, size){
    return X+size > 0 && X-size < canvas.width && Y+size > 0 && Y-size < canvas.height;
}

function dist(X1, Y1, X2, Y2){
    return Math.hypot(X1-X2, Y1-Y2);
}

function random(min, max, round = false){
	if(round === false){
		return Math.random()*(max-min)+min;
	}else{
		// return round(Math.random()*(max-min)+min);
	}
}

function lerp(v0, v1, t) {
    return v0*(1-t)+v1*t
}
function lerpArray(arr, targetArr, t){
    let targetPos = [arr[0]*(1-t)+targetArr[0]*t, arr[1]*(1-t)+targetArr[1]*t];
    return targetPos;
}

function arrayRemove(arr, value) { 
    return arr.filter(function(ele){
        return ele != value;
    });
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4){ //returns [x,y] of intersection, if there is no intersection then return false
	var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	if(den == 0){return false}
	var t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
	var u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
	if(t > 0 && t < 1 && u > 0){
		x = x1 + t * (x2 - x1);
		y = y1 + t * (y2 - y1);
		return [x,y];
	}else{
		return false;
	}
}
function AABBCollision(rect1, rect2){
    var rect1X = rect1[0], rect1Y = rect1[1], rect1W = rect1[2], rect1H = rect1[3];
    var rect2X = rect2[0], rect2Y = rect2[1], rect2W = rect2[2], rect2H = rect2[3];
    return rect1X < rect2X + rect2W && rect1X + rect1W > rect2X && rect1Y < rect2Y + rect2H && rect1Y + rect1H > rect2Y;
}

const identityTransform = [1,0,0,1,0,0];
// Drawing
class image{
	constructor(imageLocation){
		this.img = new Image();
		this.img.src=imageLocation;
	}	

	drawImg(X,Y,W,H, alpha, dsdx=[0,0], dwdh=[0,0]){
		c.globalAlpha = alpha;
		if(dwdh == [0,0]){
			c.drawImage(this.img, X,Y, W,H);
		}else{
			c.drawImage(this.img,...dsdx,...dwdh,X,Y,W,H);
		}
		c.globalAlpha = 1;
	}

	drawRotatedImg(X, Y, W, H, alpha, rotation, rotateAroundX = 0, rotateAroundY = 0){
		c.save();
		c.translate(X, Y);
		c.rotate(rotation);
		this.drawImg(-rotateAroundX, -rotateAroundY, W, H, alpha);
		c.restore();
	}
}

class spriteSheet{
    constructor(src,wofsprite,hofsprite,animationTimer,x,y,w,h){
        this.img = new Image();
        this.img.src = src;
        this.w = wofsprite;
        this.h = hofsprite;
        this.sheetW = this.img.width;
        this.sheetH = this.img.height;
        this.fps = animationTimer;
        this.sheetX = 0;
        this.sheetY = 0;
        this.x = x;
        this.y = y;
        this.states = {};
        this.state = "";
        this.timer = 0;
        this.draww = w;
        this.drawh = h;
    }
    draw(alpha = 1){
        c.save();
        if(this.sheetX >= this.states[this.state][1]*this.w){
            this.sheetX = 0;
        }
		c.globalAlpha = alpha;
        c.drawImage(this.img,this.sheetX,this.states[this.state][0],this.w,this.h,this.x,this.y,this.draww,this.drawh);
        c.restore();
    }
    addState(statename,correspondingLine,numofframes){
        this.states[statename] = [correspondingLine*this.h-this.h,numofframes];
        this.state = statename;
    }
    frameCalc(startingframe){
        this.timer++;
        if (this.timer > this.fps){
            this.timer = 0;
            this.sheetX+=this.w;
            if(this.sheetX >= this.states[this.state][1]*this.w){
                this.sheetX = startingframe*this.w;
            }
        }
    }
}

function drawLine(point1, point2, col, lw = 1,alpha=1){
    let x1 = point1[0], y1 = point1[1], x2 = point2[0], y2 = point2[1]; 
    
    c.beginPath();
    c.globalAlpha = alpha
    c.lineWidth = lw
    c.strokeStyle = col;
    c.moveTo(x1,y1);
    c.lineTo(x2,y2);
    c.globalAlpha = 1
    c.stroke();
    c.lineWidth = 1;
}

function drawRect(rect,col,fill=1,fillcolor=col,alpha=1){
    x = rect[0];
    y = rect[1];
    w = rect[2];
    h = rect[3];
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.rect(x,y,w,h);
    if (fill){
        c.fillStyle = fillcolor;
        c.fill();
    }
    c.stroke();
    c.restore();
}
function drawRoundedRect(rect, radii, col,fill=1,fillcolor=col,alpha=1){
    x = rect[0];
    y = rect[1];
    w = rect[2];
    h = rect[3];
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.roundRect(x,y,w,h,radii);
    if (fill){
        c.fillStyle = fillcolor;
        c.fill();
    }
    c.stroke();
    c.restore();
}
function drawCircle(pos,r,col,fill=1,fillcolor=col,alpha=1, lw=1){
    let x = pos[0], y = pos[1];

    c.save();
    c.lineWidth = lw
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.arc(x,y,r,0,360,false);
    if (fill){
        c.fillStyle = fillcolor;
        c.fill();
    }
    c.stroke();
    c.closePath();
    c.restore();
}

function drawPolygon(vertices, color, fill, alpha,lW){
    c.save();
    c.strokeStyle = color;
    c.globalAlpha = alpha;
    c.beginPath();
    c.moveTo(vertices[0][0],vertices[0][1]);
    c.lineWidth = lW
    for(var vert of vertices){
        c.lineTo(vert[0],vert[1]);
    }
    c.lineTo(vertices[0][0],vertices[0][1])
    if (fill){
        c.fillStyle=color;
        c.fill();
    }
    c.lineWidth = 1
    c.stroke();
    c.closePath();
    c.restore();
}

function drawRotatedRect(rect, colour, rotation){
    X = rect[0];
    Y = rect[1];
    W = rect[2];
    H = rect[3];
	c.save();
	c.translate(X, Y);
	c.rotate(rotation);
	c.fillStyle = colour;
	c.beginPath();
	c.rect(-W/2,-H/2, W, H);
	c.fill();
	c.restore();
}
class TextBox {
    constructor(string, rect, textSize, color, offset) {
        this.string = string;
        this.rect = rect;
        this.offset = offset
        this.color = color
        this.textSize = textSize;
        this.charCount = 0;
        this.percentage = 1
    }

    draw() {
        var x = this.rect[0]+this.offset[0],
            y = this.rect[1]+this.textSize+this.offset[1],
            w = this.rect[2],
            h = this.rect[3];
        // wrapping logic here
        c.font = this.textSize+'px testfont';
        var words = this.string.split(' ');

        var line = '';
        var lines = [];
        for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var testWidth = c.measureText(testLine).width+this.offset[0];
            if (testWidth > w - this.offset[0] && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            }
            else {
                line = testLine;
            }
        }
        lines.push(line);

        this.charCount = 0;
        for(let line of lines){
            for(let letter of line){
                this.charCount+=1;
            }
        }

        let index = Math.round(this.charCount*this.percentage)
        let newLines = [];
        let iter = 0;
        for(let line of lines){
            let newLine = '';
            for(let letter of line){
                iter+=1;
                if(iter < index){
                    newLine += letter
                }else{
                    break;
                }
                
            }
            newLines.push(newLine);
        }
        for(var k in newLines){
            c.fillStyle = this.color;
            c.fillText(newLines[k], x, y+(k*this.textSize));
        }
    }
}
function enlargeRect(inputRect, a,b, preserveBottomVerticesY=false){
    let rect = inputRect;
    let transVec;
    if(preserveBottomVerticesY){
        transVec = [-(rect[0]+rect[2]/2),-(rect[1]+rect[3])]
    }else{
        transVec = [-(rect[0]+rect[2]/2),-(rect[1]+rect[3]/2)]
    }
    let vertices = [[rect[0],rect[1]],[rect[0]+rect[2],rect[1]],[rect[0]+rect[2],rect[1]+rect[3]],[rect[0], rect[1]+rect[3]]]
    for(let i in vertices){
        vertices[i] = math.add(vertices[i], transVec);
    }
    let L = [[a,0],[0,b]];

    for(let i in vertices){
        vertices[i] = math.multiply(L,vertices[i]);
    }
    
    for(let i in vertices){
        vertices[i] = math.subtract(vertices[i], transVec);
    }
    rect = [vertices[0][0],vertices[0][1],vertices[1][0]-vertices[0][0],vertices[2][1]-vertices[0][1]];
    return rect;
}
