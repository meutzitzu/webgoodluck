"use strict";
let x=0.0, y=0.0, z=1.0, r=0.0, speed=0.01;
let default_x=0.0, default_y=0.0, default_z=1.0, default_r=0.0, default_speed=0.01;


var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
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


const array=[
"./mandelbrot.glsl", 
"./test1.glsl"
];
const programs=[], timeUniformLocations=[], viewUniformLocations=[], resolutionUniformLocations=[], positionAttributeLocations=[];
let curindex=0;

function newIndex(index)
{
	if (pressedKeys[49])return 0;
	if (pressedKeys[50])return 1;

	return index;
}
function switcher(gl, index)
{
	gl.useProgram(programs[curindex]);
	webglUtils.resizeCanvasToDisplaySize(gl.canvas);
	gl.uniform1f(timeUniformLocations[curindex], timeStamp/1000.0);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.uniform2f(resolutionUniformLocations[curindex], gl.canvas.width, gl.canvas.height);
	gl.uniform4f(viewUniformLocations[curindex], x, y, z, r);
	gl.drawArrays(primitiveType, offset, count);
}
function main() {
// Get A WebGL context
	var canvas = document.getElementById("c");
	var gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}
	

// create GLSL shaders, upload the GLSL source, compile the shaders
	Promise.all([fetch("./vertex.glsl"), fetch(array[0]), fetch(array[1])])
		.then((values) => {
			let result = [];
			for (const i in values){
				result.push(values[i].text());
			}
			return Promise.all(result);
		})
		.then((values) => 
		{
		//	console.log(values);
		{
			const ma=[];
			ma[10]="plm";
			console.log(ma); 
		}
			for (var i=1; i<values.length; i++){
				var j=i-1;
				programs[j]=createProgram(gl,
					createShader(gl, gl.VERTEX_SHADER, values[0]),
					createShader(gl, gl.FRAGMENT_SHADER, values[i])
				);
				timeUniformLocations[j]=gl.getUniformLocation(programs[j], "u_time"); 
				
				viewUniformLocations[j]=gl.getUniformLocation(programs[j], "u_view"); 

				resolutionUniformLocations[j]=gl.getUniformLocation(programs[j], "u_resolution");

				positionAttributeLocations[j]=gl.getAttribLocation(programs[j], "a_position");
			}	
			let positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			
			var positions = [
			  -1.0, -1.0,
			  -1.0,  1.0,
			   1.0,  1.0,
			  -1.0, -1.0,
			   1.0, -1.0,
			   1.0,  1.0,
			];
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

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
		// set time uniform
				gl.useProgram(programs[curindex]);
				webglUtils.resizeCanvasToDisplaySize(gl.canvas);
				gl.uniform1f(timeUniformLocations[curindex], timeStamp/1000.0);
				gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
				gl.uniform2f(resolutionUniformLocations[curindex], gl.canvas.width, gl.canvas.height);
				gl.uniform4f(viewUniformLocations[curindex], x, y, z, r);
				gl.drawArrays(primitiveType, offset, count);
			
		// recursive invocation
			
      //recursive call to renderLoop
			window.requestAnimationFrame(renderLoop);
				z/=(pressedKeys[32] ? 1.0+speed : 1.0);
				z*=(pressedKeys[16] ? 1.0+speed : 1.0);
				x+=
					z*
					(
						Math.cos(r)*
						(
							(pressedKeys[65] ? -speed : 0.0)+
							(pressedKeys[68] ? speed : 0.0)
						)
						-
						Math.sin(r)*
						(
							(pressedKeys[87] ? speed : 0.0)+
							(pressedKeys[83] ? -speed : 0.0)
						)
					);
				y+=
					z*(
						Math.sin(r)*((pressedKeys[65] ? -speed : 0.0)+
						(pressedKeys[68] ? speed : 0.0))
						+
						Math.cos(r)*((pressedKeys[87] ? speed : 0.0)+
						(pressedKeys[83] ? -speed : 0.0))
					);
				//x+=z*((pressedKeys[65] ? -speed : 0.0)+(pressedKeys[68] ? speed : 0.0));
				r+=(pressedKeys[81] ? speed : 0.0);
				r+=(pressedKeys[69] ? -speed : 0.0);
				speed*=(pressedKeys[88] ? 1.1 : 1.0);
				speed/=(pressedKeys[90] ? 1.1 : 1.0);
				if (pressedKeys[82]){
					z=default_z;
					x=default_x;
					y=default_y;
					r=default_r;
					speed=default_speed;
				}
				let oldindex=curindex;
				curindex=newIndex(curindex);
				if (curindex!=oldindex)switcher(gl, curindex);
			}

			// begin the render loop
			window.requestAnimationFrame(renderLoop);
		})
}

main();
