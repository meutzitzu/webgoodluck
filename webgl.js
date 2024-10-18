"use strict";
// the values that you change based on what key you press
let x=0.0, y=0.0, z=1.0, rx=0.0, ry=0.0, rz=0.0, speed=0.01, key=1.0;
let default_x=0.0, default_y=0.0, default_z=1.0, default_rx=0.0, default_ry=0.0, default_rz=0.0, default_speed=0.01;


let MSAA=4.0, maxiters=128.0;
// an array that traks the keys pressed
var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }


// functie copiata de pe net
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
	//console.logging some shit for reasons (idk why)
  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}
// function that makes the Shader into the program
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  //putting the shader into gl or sometinh idk
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
//console.logging some shit for reasons (idk why)
  console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
  gl.deleteProgram(program);
  return undefined;
}

// the array of glsl files
const array=[
"./mandelbrot.glsl",
"./test1.glsl"
];
// the uniform arrays that fucked me up
const programs=[], timeUniformLocations=[], resolutionUniformLocations=[], positionAttributeLocations=[], MSAAAtributeLocations=[], maxitersAtributeLocations=[]; 
// position and rotations unifmors
const XUniformLocations=[], YUniformLocations=[], ZUniformLocations=[];
let curindex=0;

// function that switches the index 
function newIndex(index)
{
	for (var i=0; i<array.length; i++){
		if (pressedKeys[i+49])return i;
	}
	// or not if it did change
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
	
	/*
	what to do:
	vec2 x and rx
	vec2 y and ry
	vec2 z and rz 
	*/
	gl.uniform2f(XUniformLocations[curindex], x, rx);
	gl.uniform2f(YUniformLocations[curindex], y, ry);
	gl.uniform2f(ZUniformLocations[curindex], z, rz);
	
	//gl.uniform4f(viewUniformLocations[curindex], x, y, z, r);
	gl.uniform1f(MSAAAtributeLocations[curindex], MSAA);
	gl.uniform1f(maxitersAtributeLocations[curindex], maxiters);
	gl.drawArrays(primitiveType, offset, count);
}
// MAIN
function main() {
// Get A WebGL context
	var canvas = document.getElementById("c");
	// I am gonna pretend I know what the fuck is this (it makes webgl2 avaleble for browser, thx google)
	var gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}
	
	var gpuPerformence=getGPU(gl, canvas);
	// calculation for bullshit
	maxiters=powerOf2(gpuPerformence/25);
	MSAA=powerOf2(gpuPerformence)/(maxiters*4);
	console.log(MSAA);
	console.log(maxiters);
// create GLSL shaders, upload the GLSL source, compile the shaders
	Promise.all([fetch("./vertex.glsl"), fetch(array[0]), fetch(array[1])])
		// I was told this shit works so I am gonna just say YES I WILL LEAVE IT ALONE (FOR NOW)
		.then((values) => {
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
			// just leave this here it is funny as fuck
			const ma=[];
			ma[10]="plm";
			console.log(ma); 
		}
			// the for that precompiles the shaders
			for (var i=1; i<values.length; i++){
				// this shit made me cry (a little)
				var j=i-1;
				// creating the j-ght program 
				programs[j]=createProgram(gl,
					createShader(gl, gl.VERTEX_SHADER, values[0]),
					createShader(gl, gl.FRAGMENT_SHADER, values[i])
				);
				// uniforms pointing location idk it works do not make me do it again please
				timeUniformLocations[j]=gl.getUniformLocation(programs[j], "u_time"); 
				

				XUniformLocations[j]=gl.getUniformLocation(programs[j], "u_x");
				YUniformLocations[j]=gl.getUniformLocation(programs[j], "u_y");
				ZUniformLocations[j]=gl.getUniformLocation(programs[j], "u_z");

				//viewUniformLocations[j]=gl.getUniformLocation(programs[j], "u_view"); 

				resolutionUniformLocations[j]=gl.getUniformLocation(programs[j], "u_resolution");

				MSAAAtributeLocations[j]=gl.getUniformLocation(programs[j], "u_MSAA");

				maxitersAtributeLocations[j]=gl.getUniformLocation(programs[j], "u_maxiters");

				positionAttributeLocations[j]=gl.getAttribLocation(programs[j], "a_position");
			}	
			// idk what this is but I aint gonna delete it (yet)
			let positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			
			// ah yes positions for the triangle or something
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
			
		// draw (nu atinge ca garanteaza mihai ca e bun)
			var primitiveType = gl.TRIANGLES;
			var offset = 0;
			var count = 6;

			function renderLoop(timeStamp) { 
		// set uniforms 
				switcher(gl, timeStamp, primitiveType, offset, count);
			
		// recursive invocation
			
      //recursive call to renderLoop
			window.requestAnimationFrame(renderLoop);
			// incrementation of values from line 1-2
				z/=(pressedKeys[32] ? 1.0+speed : 1.0);
				z*=(pressedKeys[16] ? 1.0+speed : 1.0);
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


				/*
				insert aci ce taste vrei sa folosesti sa schimbi rotatia pe rx si ry
				*/
				rz+=(pressedKeys[81] ? speed : 0.0);
				rz+=(pressedKeys[69] ? -speed : 0.0);
				speed*=(pressedKeys[88] ? 1.1 : 1.0);
				speed/=(pressedKeys[90] ? 1.1 : 1.0);
				// just press r and you are back to where you started
				if (pressedKeys[82]){
					z=default_z;
					x=default_x;
					y=default_y;
					speed=default_speed;
					rz=default_rz;
					rx=default_rx;
					ry=default_ry;
				}
				// checking if index changed or nah
				let oldindex=curindex;
				curindex=newIndex(curindex);
				if (curindex!=oldindex)switcher(gl, timeStamp, primitiveType, offset, count);

			}

			// begin the render loop
			window.requestAnimationFrame(renderLoop);
		})
}

// lets call main 
main();
