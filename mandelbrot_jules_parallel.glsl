#version 300 es
precision highp float;
out vec4 FragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_CZ;
uniform vec3 u_pos;
uniform vec3 u_rot;
uniform float u_MSAA;
uniform float u_maxiters;

#define pi radians(180)

vec3 hsv2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 cm(vec2 num1, vec2 num2)
{
    vec2 rez;
    rez.x=num1.x*num2.x-num1.y*num2.y;
    rez.y=num1.x*num2.y+num1.y*num2.x;
    return rez;
}

void main()
{
    vec2 uv = vec2(gl_FragCoord.x / u_resolution.x, gl_FragCoord.y / u_resolution.y) * 2.0 + vec2(-1.0);
    float aspect_ratio = float(u_resolution.x) / u_resolution.y;
    uv.x *= aspect_ratio;

    // Determine which half of the screen we're in
    bool isLeft = gl_FragCoord.x < u_resolution.x * 0.5;

    // Offset for each half so both are centered in their region
    float xOffset = isLeft ? -0.5 : 0.5;
    uv.x -= xOffset * aspect_ratio;

    // Apply rotation and zoom
    vec2 aux1 = uv;
    uv.x = aux1.x * cos(u_rot.z) - aux1.y * sin(u_rot.z);
    uv.y = aux1.x * sin(u_rot.z) + aux1.y * cos(u_rot.z);
    uv *= u_pos.z;
    uv += u_pos.xy;

    int l = 0;
    float h = 0.0;

    for(int s=0; s<int(u_MSAA); ++s)
    {
        vec2 aux = uv + vec2(random(vec2((s+1)))) / u_resolution * 1.0 * u_pos.z;
        if(isLeft) {
            // Mandelbrot
            vec2 z = aux + u_CZ.zw;
            vec2 c = aux;
            for(int i=0; i<int(u_maxiters); ++i)
            {
                z = cm(z, z);
                z += c;
                l = (length(z) > 4.0 ? i : l);
            }
            h += (float(l) / u_maxiters) / u_MSAA;
        } else {
            // Jules
            vec2 z = aux + u_CZ.zw;
            vec2 c = u_pos.xy;
            for(int i=1; i<int(u_maxiters); ++i)
            {
                z = cm(z, z);
                z += c;
                l = (length(z) > 4.0 ? i : l);
            }
            h += (float(l) / u_maxiters) / u_MSAA;
        }
    }

    vec3 col;
    if(isLeft) {
        col = hsv2rgb(vec3(1.0 * h + 0.1 * u_time, 1.0, sqrt(h)));
    } else {
        col = hsv2rgb(vec3(3.0 * h, sqrt(h), sqrt(h)));
    }

    // --- Crosshair overlay ---
    // Center of left or right half
    float centerX = isLeft ? u_resolution.x * 0.25 : u_resolution.x * 0.75;
    float centerY = u_resolution.y * 0.5;
    float crosshairThickness = 1.0; // thinner
    float crosshairLength = 8.0;    // shorter

    // Distance from current pixel to crosshair center
    float dx = abs(gl_FragCoord.x - centerX);
    float dy = abs(gl_FragCoord.y - centerY);

    // Horizontal line
    float hLine = step(dx, crosshairLength) * step(dy, crosshairThickness);
    // Vertical line
    float vLine = step(dy, crosshairLength) * step(dx, crosshairThickness);

    float cross = max(hLine, vLine);

    // Blend crosshair (white) over fractal color, more transparent
    if (cross > 0.0) {
        col = mix(col, vec3(1.0), 0.4);
    }

    FragColor = vec4(col, 1.0);
}