// Adapted from https://noisehack.com/build-music-visualizer-web-audio-api/. Original shader - https://www.shadertoy.com/view/XsXXDn
uniform float time;
uniform sampler2D audioData;
varying vec3 vWorldPosition;

void main() {
    vec3 c;
    float z = 0.1 * time;
    vec2 uv = vWorldPosition.xz / 5.0;
    vec2 p = uv;
    float l = 0.2 * length(p);

    float intensity = texture2D(audioData, vec2(l, 0.5)).x * 0.1;

    for (int i = 1; i < 3; i++) {
        z += 0.07;
        uv += p / l * abs(sin(l * 9.0 - z * 2.0));
        c[i] = 0.01 / length(abs(mod(uv, 1.0) - 0.5));
    }

    gl_FragColor = vec4(c / l * intensity, time);
}