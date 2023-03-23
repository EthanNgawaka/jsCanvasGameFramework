function draw(){
	
}
function update(){

}

function main(){
    update();
    draw();
	oldKeys = {...keys};
}

setInterval(main, 1000/60)
