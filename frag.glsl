#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

#define union min
#define isect max
#define PI 3.141592

// we need to declare an output for the fragment shader
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

int MAX_STEPS = 64;
int MSAA = 4;
float SURFACE_DIST = 0.000001;
float MAX_DIST = 100.0;

float random (vec2 st)
{
    return fract( sin( dot( st.xy, vec2( 12.9898, 78.233))) * 43758.5453123) - 0.5;
}

float SphereSDF( vec3 pos, vec3 origin, float radius)
{
	return length(origin - pos) - radius;
}

float OctahedronSDF( vec3 p, float s)
{
  p = abs(p);
  float m = p.x+p.y+p.z-s;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+s),0.0,s); 
  return length(vec3(q.x,q.y-s+k,q.z-k)); 
}

float BoxSDF( vec3 p, vec3 b )
{
	vec3 q = abs(p) - b;
	return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float GroundSDF( vec3 pos)
{
	return pos.z;
}

float SceneSDF( vec3 pos)
{
	return 
		max(
			-SphereSDF(
				pos, 
				vec3(0.0), 
				1.5
				),
			BoxSDF(
				pos,
				vec3(1.0)
			) - 0.25
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

vec4 rayMarch( vec3 ro, vec3 rd)
{
	float d0 = 0.;
	float dm = MAX_DIST;
	float a = 1.0;
	float n = 0.0;
	int i=0;
	for (i=0; i<MAX_STEPS; ++i)
	{
		vec3 p = ro + d0*rd;
		float dS = SceneSDF(p);
		dm = min(dm, dS);
		a = min(a, dS/(sqrt(d0*d0+dS*dS)));
		d0 += dS;
		if(dS<SURFACE_DIST || dS>MAX_DIST) break;
	}
	n = float(i)/float(MAX_STEPS);
	return vec4(d0, dm, n, a);
	//return signature: DISTANCE, idk, EDGE, idklol
}

float light(vec3 pos)
{
	vec3 light_origin = vec3(0.0, 0.0, 6.0);
	light_origin.xy = 5.0 * vec2(cos(u_time), sin(u_time));
	vec3 l = normalize(light_origin - pos);
	vec3 n = normalize(grad(pos));

	float diff = clamp(dot(n,l), -1.0, 1.0)*0.5 + 0.5;
	vec4 rM = rayMarch(pos + n * 2.0 * SURFACE_DIST, l);
	
	//diff *= ( rM.r < length(light_origin - pos) ? 0.5 + rM.a : 1.0);

	return diff;
}

vec3 Rotate(vec3 vector, vec3 bivector){
	return vec3(
		vector.x*cos(bivector.z) - vector.y*sin(bivector.z),
		vector.x*sin(bivector.z) + vector.y*cos(bivector.z),
		vector.z
		);
}

vec3 Rotate2(vec3 vector, vec3 bivector){
	return vec3(
		vector.x,
		vector.y*cos(bivector.x) - vector.z*sin(bivector.x),
		vector.y*sin(bivector.x) + vector.z*cos(bivector.x)
		);
}



void main() {

	float aspect = u_resolution.x/u_resolution.y;
	vec2 uv = vec2(gl_FragCoord.x/u_resolution.x, gl_FragCoord.y/u_resolution.y);
	uv -= vec2(0.5, 0.5);
	uv.x *= aspect;

	vec2 mouse_uv = -(vec2(u_mouse.x/u_resolution.x, u_mouse.y/u_resolution.y) - vec2(0.5))*vec2(2.0*PI);

	vec3 ro = Rotate(Rotate2(vec3(0.0, -5.0, 0.0), vec3(mouse_uv.y, 0.0,0.0)), vec3(0.0, 0.0, mouse_uv.x));
	vec3 rd = normalize(Rotate(Rotate2(vec3(uv.x, 1.0, uv.y),vec3(mouse_uv.y, 0.0,0.0) ), vec3(0.0, 0.0, mouse_uv.x)));

	vec4 rM = rayMarch(ro, rd);
	vec3 p = ro + rd*rM.r;
	float diff = light(p);
	float ao = rM.b;
	float bloom = rM.g;
	vec3 col = vec3(mix(vec3(0.0, 1.0, 1.0),vec3(1.0, 1.0, 0.0),diff));
	if (rM.r>MAX_DIST){
			float checker = (
				(mod(
					(32.0/PI)*atan(rd.z/length(vec2(rd.xy)))
					,2.0
				) - 1.0)
				*
				(mod(
					(32.0/PI)*atan(rd.y,rd.x)
					,2.0
				) - 1.0)
			);
		col = mix(
			vec3(-0.3*rd),
			vec3(0.1*rd),
			0.8*(checker*checker)
		);
	}
	outColor = vec4(col, 1);
}
