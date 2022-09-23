#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;

int MAX_STEPS = 128;
int MSAA = 1;
float SURFACE_DIST = 0.0001;
float MAX_DIST = 100.0;

float SphereSDF( vec3 pos, vec3 origin, float radius)
{
	return length(origin - pos) - radius;
}

float GroundSDF( vec3 pos)
{
	return pos.y;
}

float SceneSDF( vec3 pos)
{
	return min
		(
		GroundSDF(pos),
		max
		(
		abs(SphereSDF(pos, vec3(0.0, 0.5, 5.0), 1.0)) -0.1,
		-SphereSDF(pos, vec3(0.0 + 0.2*cos(u_time), 3.5, 4.5 + 0.2*sin(u_time)), 2.8))
		);
}

vec3 grad( vec3 pos)
{
	vec2 e = vec2( 0.002, 0.0);
	float d = SceneSDF(pos);
	vec3 n = d - vec3
	(
		SceneSDF(pos - e.xyy),
		SceneSDF(pos - e.yxy),
		SceneSDF(pos - e.yyx)
	);
	return (n);
}

float rayMarch( vec3 ro, vec3 rd)
{
	float d0 = 0.;
	for (int i=0; i<MAX_STEPS; ++i)
	{
		vec3 p = ro + d0*rd;
		float dS = SceneSDF(p);
		d0 += dS;
		if(dS<SURFACE_DIST || dS>MAX_DIST) break;
	}
	return d0;
}

float light(vec3 pos)
{
	vec3 light_origin = vec3(0.0, 5.0, 6.0);
	light_origin.xz = 5.0 * vec2(cos(u_time), sin(u_time));
	vec3 l = normalize(light_origin - pos);
	vec3 n = normalize(grad(pos));

	float diff = clamp(dot(n,l), 0.0, 1.0);
	float d = rayMarch(pos + n * 2.0 * SURFACE_DIST, l);
	
	diff *= ( d < length(light_origin - pos) ? 0.2 : 1.0);

	return diff;
}



float random (vec2 st)
{
    return fract( sin( dot( st.xy, vec2( 12.9898, 78.233))) * 43758.5453123) - 0.5;
}

void main() {

	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;

	vec3 ro = vec3(0.0, 1.0, 0.0);
	vec3 rd = normalize(vec3(uv.x, uv.y, 1));

	float d = rayMarch(ro, rd);
	vec3 p = ro + rd*d;
	float diff = light(p);
	
	vec3 col = vec3(diff);

	outColor = vec4(col, 1);
}

