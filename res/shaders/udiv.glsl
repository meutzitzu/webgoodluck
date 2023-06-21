#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

#define PI 3.141592

#define ORLX 1.0

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
//uniform vec2 u_texUV;
uniform sampler2D u_velocity;
uniform sampler2D u_obstacle;

vec4 neighbour(vec2 offset)
{
	return texture(
		u_velocity, 
		vec2(
			(gl_FragCoord.x + 1.0*offset.x)/u_resolution.x,
			(gl_FragCoord.y + 1.0*offset.y)/u_resolution.y 
		)
	);
}

vec4 neighbour2(vec2 offset)
{
	return texture(
		u_obstacle, 
		vec2(
			(gl_FragCoord.x + 1.0*offset.x)/u_resolution.x,
			(gl_FragCoord.y + 1.0*offset.y)/u_resolution.y 
		)
	);
}
 
vec4 self()
{
	return
	 1.0*(neighbour(vec2( 0.0,  0.0)));
}

vec4 kernel()
{
	return
	  0.0*(neighbour(vec2( 0.0,  0.0))) +
	  1.0*(neighbour(vec2( 1.0,  0.0))) +
	  1.0*(neighbour(vec2( 1.0,  1.0))) +
	  1.0*(neighbour(vec2( 0.0,  1.0))) +
	  1.0*(neighbour(vec2(-1.0,  1.0))) +
	  1.0*(neighbour(vec2(-1.0,  0.0))) +
	  1.0*(neighbour(vec2(-1.0, -1.0))) +
	  1.0*(neighbour(vec2( 0.0, -1.0))) +
	  1.0*(neighbour(vec2( 1.0, -1.0)));
}

void main() {
	
	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	
	vec4 prev = vec4(self().xy, 0.0, 0.0);

	vec4 solids = 
		vec4(
			neighbour2(vec2( 1.0, 0.0)).r,
			neighbour2(vec2( 0.0, 1.0)).r,
			neighbour2(vec2(-1.0, 0.0)).r,
			neighbour2(vec2( 0.0,-1.0)).r
		)
	;

	float numSolids =
		float(
			 neighbour2(vec2( 1.0, 0.0)).r
			+neighbour2(vec2( 0.0, 1.0)).r
			+neighbour2(vec2(-1.0, 0.0)).r
			+neighbour2(vec2( 0.0,-1.0)).r
		)
	;
	
	vec4 equalize =
		0.5*vec4
		(
			+(prev.z + (neighbour(vec2( 1.0, 0.0))).z),
			+(prev.z + (neighbour(vec2( 0.0, 1.0))).w),
			-(prev.z + (neighbour(vec2(-1.0, 0.0))).x),
			-(prev.w + (neighbour(vec2( 0.0,-1.0))).y) 
		)
	;
	
	//prev = prev + equalize;

	/*
	float div = 
		ORLX
		*(
			+prev.x*(1.0 - neighbour2(vec2( 1.0, 0.0)).r)
			+prev.y*(1.0 - neighbour2(vec2( 0.0, 1.0)).r)
			+prev.z*(1.0 - neighbour2(vec2(-1.0, 0.0)).r)
			+prev.w*(1.0 - neighbour2(vec2( 0.0,-1.0)).r)
		)
	;
	*/

	float div = 
		ORLX
		*(
			+prev.x
			+prev.y
			-neighbour(vec2( 0.0, 1.0)).x
			-neighbour(vec2( 0.0, 1.0)).y
		)
	;
	
	vec4 undiv = 
		vec4(
			div/(4.0),
			div/(4.0),
			div/(4.0),
			div/(4.0)
		)
	;
	
	vec4 cell = (prev - 1.0*undiv )*(1.0 - neighbour2(vec2(0.0)));
	
	outColor = cell;
}
