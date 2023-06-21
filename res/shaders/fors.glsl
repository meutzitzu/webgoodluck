#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

#define PI 3.141592

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_texture;

void main() {
	
	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	/*
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;
	*/
	
	vec2 mouse_uv = (vec2(u_mouse.x/u_resolution.x, 1.0-u_mouse.y/u_resolution.y));

	vec2 direction = 
		vec2
		(
			(uv.y-mouse_uv.y),
			-(uv.x-mouse_uv.x)
		)
	;
	direction = direction/length(direction);	

	float magnitude = 
		1.0
		*
		exp
		(
			-1000.0
			*
			(
				(uv.x-mouse_uv.x)*(uv.x-mouse_uv.x)+
				(uv.y-mouse_uv.y)*(uv.y-mouse_uv.y)
			)
		)
	;

	vec2 force = direction*magnitude;
	outColor = 0.99*texture(u_texture, uv) + vec4(force, 0.0, 0.0);
}
