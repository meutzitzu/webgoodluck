#version 300 es
precision highp float;

uniform vec2 u_resolution;   // (width, height)
uniform float u_time;        
uniform vec3 u_pos;          // x, y: translation; z: zoom (scale factor)
uniform vec3 u_rot;          // Rotation 
uniform vec2 u_ab;           // Parameters for the Weierstrass function

out vec4 fragColor;          

// Converts HSV color to RGB color.
vec3 hsv2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0),
                             6.0) - 3.0) - 1.0,
                     0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// Computes the normalized Weierstrass function for a given x value.
float weierstrass(float x) {
    float a = u_ab.x;
    float b = u_ab.y;
    
    int N = int(clamp(20.0 + log2(u_pos.z) * 8.0, 20.0, 60.0));
    float sum = 0.0;
    float norm = 0.0;
    for (int n = 0; n < 60; n++) { 
        if (n >= N) break;
        float weight = pow(a, float(n));
        sum += weight * cos(pow(b, float(n)) * 3.14159 * x);
        norm += weight;
    }
    return sum / norm;
}

void main() {
    // Convert pixel coordinates to normalized device coordinates [-1,1]
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv = uv * 2.0 - 1.0;
    
    // Adjust horizontal coordinate based on canvas aspect ratio
    float aspect = u_resolution.x / u_resolution.y;
    uv.x *= aspect;
    
    // Rotate the coordinate space by the angle stored in u_rot.z
    float theta = u_rot.z;
    vec2 rotatedUV;
    rotatedUV.x = uv.x * cos(theta) - uv.y * sin(theta);
    rotatedUV.y = uv.x * sin(theta) + uv.y * cos(theta);
    
    rotatedUV = rotatedUV * u_pos.z + u_pos.xy;
    
    float x = rotatedUV.x * 1.0;
    
    // Calculate the Weierstrass function value at x.
    float yValue = weierstrass(x);
    
    // Generate a smooth line around the function value using smoothstep.
    float thickness = 0.02 / u_pos.z;
    float line = smoothstep((yValue - thickness), (yValue + thickness), rotatedUV.y);
    
    // Create a color using the hsv2rgb function.
    // Saturation is set to 1, and brightness is determined by the 'line'.
    vec3 col = hsv2rgb(vec3(0.5 * line + 0.1 * u_time, 1.0, line));
    
    fragColor = vec4(col, 1.0);
}