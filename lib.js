/*
A small, simple javascript library for game making, currently dosent support images or sound.
has drawing functions for most shapes and input handing
*/

var canvas = document.getElementById("main");
canvas.setAttribute('draggable', false);
var entirePage = document.getElementById("wholePage");

var c = canvas.getContext("2d"); //c means context
document.addEventListener('contextmenu', event => event.preventDefault());

const windoww = c.width;
const windowH = c.height;

//Mouse Stuff//
var mouse={x:0,y:0,button:{left:false, middle:false, right:false}};
canvas.addEventListener('mousemove', function(evt) {
    mouse.x = getMouseX(canvas, evt);
    mouse.y = getMouseY(canvas, evt);
}, false);
function getMouseX(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return evt.clientX - rect.left
}
function getMouseY(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return evt.clientY - rect.top
}
document.addEventListener('mousedown', function(event){
	if (event.button == 0){
        mouse.button.left = true;
    }
    if (event.button == 1){
        mouse.button.middle = true;
    }
    if (event.button == 2){
        mouse.button.right = true;
    }
});
document.addEventListener('mouseup', function(event){
	if (event.button == 0){
        mouse.button.left = false;
    }
    if (event.button == 1){
        mouse.button.middle = false;
    }
    if (event.button == 2){
        mouse.button.right = false;
    }
});

/*
The keys system currently works by adding any key pressed into the keys object
the key is the key name and the value is a bool of if it is pressed
*/
var keys = {}

var pressedAnyKey = false;
document.addEventListener('keydown', function(event) {
		current_key = event.code;
		keys[current_key] = true;
		console.log(keys);
		pressedAnyKey = true;
	}
);
document.addEventListener('keyup', function(event) {
		current_key = event.code;
		keys[current_key] = false;
	}
);

function checkKey(key){
	if(key in keys){
		if(keys[key] == true){
			return true;
		}
	}
	return false;
}

function blendCols(col1, col2, per){
	var R = col1[0] + (col2[0] - col1[0])*per;
	var G = col1[1] + (col2[1] - col1[1])*per;
	var B = col1[2] + (col2[2] - col1[2])*per;
	return [R, G, B];
}

document.documentElement.style.setProperty('image-rendering', 'pixelated');

function midPoint(point1, point2, per){
	var x = point1[0] + (point2[0] - point1[0])*per;
	var y = point1[1] + (point2[1] - point1[1])*per;
	return [x, y];
}

function onScreen(X, Y, size){
	if(X+size > 0 && X-size < canvas.width && Y+size > 0 && Y-size < canvas.width){
		return true;
	} else{
		return false;
	}
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

function AABBCollision(rect1,rect2){
    if (rect1[0] < rect2[0] + rect2[2] && rect1[0] + rect1[2] > rect2[0] && rect1[1] < rect2[1] + rect2[3] && rect1[1] + rect1[3] > rect2[1]){
        return true;
    }else{
        return false;
    }
        
}

// Drawing
class image{
	constructor(imageLocation){
		this.img = new Image();
		this.img.src=imageLocation;
	}	

	drawImg(X,Y,W,H, alpha){
		c.save();
		c.imageSmoothingEnabled = false;
        c.webkitImageSmoothingEnabled = false;
        c.mozImageSmoothingEnabled = false;
		c.globalAlpha = alpha;
		c.drawImage(this.img, X*scale,Y*scale, W*scale,H*scale);
		c.globalAlpha = 1;
		c.restore();
	}

	drawRotatedImg(X, Y, W, H, alpha, rotation, rotateAroundX = 0, rotateAroundY = 0){
		c.save();
		c.translate(X*scale, Y*scale);
		c.rotate(rotation);
		this.drawImg(-rotateAroundX, -rotateAroundY, W*scale, H*scale, alpha);
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
        c.imageSmoothingEnabled = false;
        c.webkitImageSmoothingEnabled = false;
        c.mozImageSmoothingEnabled = false;
        if(this.sheetX > this.states[this.state][1]*this.draww-this.draww){
            this.sheetX = 0;
		}
		c.globalAlpha = alpha;
        c.drawImage(this.img,this.sheetX,this.states[this.state][0],this.w,this.h,this.x*scale,this.y*scale,this.draww*scale,this.drawh*scale);
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
                this.sheetX = startingframe*this.w-this.w;
            }
        }
    }
}

function drawLine(x1,y1,x2,y2,col){
    c.beginPath();
    c.strokeStyle = col;
    c.moveTo(x1*scale,y1*scale);
    c.lineTo(x2*scale,y2*scale);
    c.stroke();
}

function drawRect(rect,col,fill,fillcolor,alpha){
    x = rect[0];
    y = rect[1];
    w = rect[2];
    h = rect[3];
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.rect(x*scale,y*scale,w*scale,h*scale);
    if (fill){
        c.fillStyle = fillcolor;
        c.fill();
    }
    c.stroke();
    c.restore();
}

function drawCircle(x,y,r,col,fill,fillcolor,alpha){
    c.save();
    c.strokeStyle = col;
    c.globalAlpha = alpha;
    c.beginPath();
    c.arc(x*scale,y*scale,r*scale,0,360,false);
    if (fill){
        c.fillStyle = fillcolor;
        c.fill();
    }
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

function showText(text, X, Y, Size, colour = "rgb(0, 0, 0)", bold = false, stroke = false){
	c.beginPath();
	if(bold === true){
		c.font = "bold "+Size+"px Arial";
	}
	else{
		c.font = Size+"px Arial"
	}
	c.textAlign = "center";
	if(stroke === false){
		c.fillStyle=colour;
		c.fillText(text, X, Y);
	}
	if(stroke === true){
		c.lineWidth = Size/25;
		c.strokeStyle = colour;
		c.strokeText(text, X, Y)
	}
}