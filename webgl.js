"use strict";

// the values that you change based on what key you press
let x=0.0, y=0.0, z=1.0, rx=0.0, ry=0.0, rz=0.0, speed=0.01, key=1.0;
let A=.5, B=3;
let default_x=0.0, default_y=0.0, default_z=1.0, default_rx=0.0, default_ry=0.0, default_rz=0.0, default_speed=0.01;

let on0=true;
let MSAA=4.0, maxiters=128.0;
// an array that traks the keys pressed
var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }


function getGPU(gl) {
    var gl;
    var debugInfo;
    var vendor;
    var renderer;
    var maxTextureSize;
    var maxRenderBufferSize;

    if (gl) {
        // Get GPU details
        debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        // Get performance-related metrics
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE); // Maximum texture size
        maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE); // Maximum renderbuffer size
    }

    console.log("GPU Renderer: " + renderer);
    console.log("Max Texture Size: " + maxTextureSize);
    console.log("Max Renderbuffer Size: " + maxRenderBufferSize);

    // A proxy performance estimate based on texture and renderbuffer size
    var performanceEstimate = Math.sqrt(maxTextureSize * maxRenderBufferSize);
    return performanceEstimate;
}



// function that creates webgl Shaders 
function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
	// idk I will put this here to look like we have more comments 
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  //console.log(success);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}
// function that makes the Shader into the program
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  //putting the shader into gl 
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

// the array of glsl files
const array=[
    "./mandelbrot.glsl",
    "./jules.glsl",
    "./weierstrass.glsl",
    "./mandelbrot_jules_parallel.glsl" // !!!!!this has to be the last one in the array
];
// the uniform arrays 
const programs=[], 
	timeUniformLocations=[], 
	resolutionUniformLocations=[], 
	positionAttributeLocations=[], 
	MSAAAtributeLocations=[], 
	maxitersAtributeLocations=[],
	abAtributeLocations=[];

// position and rotations unifmors
const posUniformLocaions=[], rotUniformLocaions=[];
let curindex=0;

// function that switches the index 
function newIndex(index)
{
    // 1-9 keys
    for (var i=0; i<array.length-1; i++){
        if (pressedKeys[i+49]) {
			on0=true;
			return i;
		}
    }

    // '0' key (main keyboard and numpad)
    if (pressedKeys[48]) {
		if (on0){
			z*=1.01;
			on0=false;
		}
		return array.length-1;
	}
	return index;
}
function powerOf2(number)
{
	var po2=1;
	while (po2<=number)po2*=2;
	return po2/2;
}
// switcher (switch was already taken)
function switcher(gl, timeStamp, primitiveType, offset, count)
{
	// bullshit that works so do not touch it
	gl.useProgram(programs[curindex]);
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
	gl.uniform1f(timeUniformLocations[curindex], timeStamp/1000.0);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.uniform2f(resolutionUniformLocations[curindex], gl.canvas.width, gl.canvas.height);
	gl.uniform3f(posUniformLocaions[curindex], x, y, z);
	gl.uniform3f(rotUniformLocaions[curindex], rx, ry, rz);
	gl.uniform2f(abAtributeLocations[curindex], A, B);
	
	//gl.uniform4f(viewUniformLocations[curindex], x, y, z, r);
	gl.uniform1f(MSAAAtributeLocations[curindex], MSAA);
	gl.uniform1f(maxitersAtributeLocations[curindex], maxiters);
	gl.drawArrays(primitiveType, offset, count);
}
function renderBoth(gl, timeStamp, primitiveType, offset, count) {
    // Left: Mandelbrot (center at -0.5/z)
    gl.useProgram(programs[0]);
    gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
    gl.uniform1f(timeUniformLocations[0], timeStamp / 1000.0);
    gl.uniform2f(resolutionUniformLocations[0], gl.canvas.width / 2, gl.canvas.height);
    gl.uniform3f(posUniformLocaions[0], x - (0.5 / z), y, z);
    gl.uniform3f(rotUniformLocaions[0], rx, ry, rz);
    gl.uniform2f(abAtributeLocations[0], A, B);
    gl.uniform1f(MSAAAtributeLocations[0], MSAA);
    gl.uniform1f(maxitersAtributeLocations[0], maxiters);
    gl.drawArrays(primitiveType, offset, count);

    // Right: Jules (center at +0.5/z)
    gl.useProgram(programs[1]);
    gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
    gl.uniform1f(timeUniformLocations[1], timeStamp / 1000.0);
    gl.uniform2f(resolutionUniformLocations[1], gl.canvas.width / 2, gl.canvas.height);
    gl.uniform3f(posUniformLocaions[1], x, y, z); 
    gl.uniform3f(rotUniformLocaions[1], rx, ry, rz);
    gl.uniform2f(abAtributeLocations[1], A, B);
    gl.uniform1f(MSAAAtributeLocations[1], MSAA);
    gl.uniform1f(maxitersAtributeLocations[1], maxiters);
    gl.drawArrays(primitiveType, offset, count);

    // Restore viewport to full canvas for next frame
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

// MAIN
function main() {
// Get A WebGL context
	var canvas = document.getElementById("c");
	// I am gonna pretend I know what this is (I actually do know, it makes webgl2 avaleble for browser, thx google)
	var gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}
	
	var gpuPerformance = getGPU(gl);
	var screenResolutionFactor = (gl.canvas.width * gl.canvas.height) / (1920 * 1080); // relative to Full HD
	var performanceEstimate = gpuPerformance / Math.sqrt(screenResolutionFactor); // Adjust for resolution

	// Adjust the performance estimate to a power of 2 and keep a minimum threshold for maxiters
	maxiters = powerOf2(Math.max(64, Math.sqrt(performanceEstimate)));

	// Ensure MSAA is between 2x and 8x, and round to the nearest power of 2
	MSAA = powerOf2(Math.min(8, Math.max(2, Math.sqrt(performanceEstimate / 1000))));

	console.log(MSAA);
	console.log(maxiters);



// create GLSL shaders, upload the GLSL source, compile the shaders
	Promise.all([
		fetch("./vertex.glsl"), 
		fetch(array[0]), 
		fetch(array[1]),
		fetch(array[2]),
		fetch(array[3]) // <-- Add this line
	]).then((values) => {
			let result = [];
			for (const i in values){
				result.push(values[i].text());
			}
			return Promise.all(result);
		})
		// passing the values
		.then((values) => 
		{
		//	console.log(values);
		{
			// just leave this here it is funny and does nothing
			const ma=[];
			ma[10]="plm";
			console.log(ma); 
		}
			// the for that precompiles the shaders
			for (var i=1; i<values.length; i++){
				var j=i-1;
				// creating the j-ght program 
				programs[j]=createProgram(gl,
					createShader(gl, gl.VERTEX_SHADER, values[0]),
					createShader(gl, gl.FRAGMENT_SHADER, values[i])
				);
				
				timeUniformLocations[j]=gl.getUniformLocation(programs[j], "u_time"); 
				

				posUniformLocaions[j]=gl.getUniformLocation(programs[j], "u_pos");
				rotUniformLocaions[j]=gl.getUniformLocation(programs[j], "u_rot");

				//viewUniformLocations[j]=gl.getUniformLocation(programs[j], "u_view"); 

				resolutionUniformLocations[j]=gl.getUniformLocation(programs[j], "u_resolution");

				MSAAAtributeLocations[j]=gl.getUniformLocation(programs[j], "u_MSAA");

				maxitersAtributeLocations[j]=gl.getUniformLocation(programs[j], "u_maxiters");

				positionAttributeLocations[j]=gl.getAttribLocation(programs[j], "a_position");
				
				abAtributeLocations[j]=gl.getUniformLocation(programs[j], "u_ab");
			}	
			
			let positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			
			// ah yes positions for the starting triangle
			var positions = [
			  -1.0, -1.0,
			  -1.0,  1.0,
			   1.0,  1.0,
			  -1.0, -1.0,
			   1.0, -1.0,
			   1.0,  1.0,
			];
			// just skip the next 20 lines please 
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
			

			// o hello there so you ignoring comments now
			let vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			gl.enableVertexAttribArray(positionAttributeLocations[curindex]);
			var size = 2;          // 2 components per iteration
			var type = gl.FLOAT;   // the data is 32bit floats
			var normalize = false; // don't normalize the data
			var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
			var offset = 0;        // start at the beginning of the buffer
			gl.vertexAttribPointer(
			    positionAttributeLocations[curindex], size, type, normalize, stride, offset);
			webglUtils.resizeCanvasToDisplaySize(gl.canvas);
		// Tell WebGL how to convert from clip space to pixels
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
			
		// Clear the canvas
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			
		// Tell it to use our program (pair of shaders)
			gl.useProgram(programs[curindex]);

			
		// Bind the attribute/buffer set we want.
			gl.bindVertexArray(vao);
			
		// draw 
			var primitiveType = gl.TRIANGLES;
			var offset = 0;
			var count = 6;

			let sideBySide = false; // Add this at the top level (outside renderLoop)
			window.addEventListener('keydown', function(e) {
				// '0' key (main keyboard and numpad)
				if ((e.keyCode === 48 || e.key === '0') && !sideBySide) {
					sideBySide = true;
				}
				// Number keys 1-9 (main keyboard and numpad)
				if (
					((e.keyCode >= 49 && e.keyCode <= 57) || (e.keyCode >= 97 && e.keyCode <= 105)) 
					&& sideBySide
				) {
					sideBySide = false;
				}
			});

			function renderLoop(timeStamp) {
				let oldindex = curindex;
				curindex = newIndex(curindex);

				// Use switcher for all shaders, including the parallel one
				switcher(gl, timeStamp, primitiveType, offset, count);

				window.requestAnimationFrame(renderLoop);

				// incrementation of values from line 1-2
				z/=(pressedKeys[32] ? 1.0+speed : 1.0);
				z*=(pressedKeys[16] ? 1.0+speed : 1.0);

				// Clamp z to avoid underflow/overflow
				z = Math.max(0.0001, Math.min(z, 1000));

				// Clamp x and y to avoid runaway values
				x = Math.max(-1e6, Math.min(x, 1e6));
				y = Math.max(-1e6, Math.min(y, 1e6));
				// booooo math formula bla bla bla 
				x+=
					z*
					(
						Math.cos(rz)*
						(
							(pressedKeys[65] ? -speed : 0.0)+
							(pressedKeys[68] ? speed : 0.0)
						)
						-
						Math.sin(rz)*
						(
							(pressedKeys[87] ? speed : 0.0)+
							(pressedKeys[83] ? -speed : 0.0)
						)
					);
				y+=
					z*(
						Math.sin(rz)*((pressedKeys[65] ? -speed : 0.0)+
						(pressedKeys[68] ? speed : 0.0))
						+
						Math.cos(rz)*((pressedKeys[87] ? speed : 0.0)+
						(pressedKeys[83] ? -speed : 0.0))
					);
				//x+=z*((pressedKeys[65] ? -speed : 0.0)+(pressedKeys[68] ? speed : 0.0));


				rz+=(pressedKeys[81] ? speed : 0.0);
				rz+=(pressedKeys[69] ? -speed : 0.0);
				

				// changing fractal oscilations
				A+=(pressedKeys[38] ? .001 : .0);
				A-=(pressedKeys[40] ? .001 : .0);
				A=Math.min(A, 0.995);
				A=Math.max(A, 0.005);
				//A=(((A*1000)+1000)%1000)/1000.0;

				B+=(pressedKeys[37] ? .1 : 0);
				B-=(pressedKeys[39] ? .1 : 0);
				// bmax = 107
				// bmin = 0
				//A=Math.min(A, 107);
				//A=Math.max(A, 0);
				//B=(B+107)%107;

				// changing speen when 'z' or 'x' pressed
				speed*=(pressedKeys[88] ? 1.1 : 1.0);
				speed/=(pressedKeys[90] ? 1.1 : 1.0);

				if (pressedKeys[82]){ // just press r and you are back to where you started
					if (curindex==array.length-1)z=default_z*1.01;
					else z=default_z;
					x=default_x;
					y=default_y;
					speed=default_speed;
					rz=default_rz;
					rx=default_rx;
					ry=default_ry;
					A=.5;
					B=3;
					on=true;
				}
				// checking if index changed or nah
				oldindex=curindex;
				curindex=newIndex(curindex);
				if (curindex!=oldindex)switcher(gl, timeStamp, primitiveType, offset, count);
			}

			// begin the render loop
			window.requestAnimationFrame(renderLoop);
		})
}

// lets call main 
main();
