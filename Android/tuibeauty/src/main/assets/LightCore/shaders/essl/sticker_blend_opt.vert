precision highp float;
attribute vec4 a_position;
attribute vec2 a_textureCoordinate;
attribute vec2 a_index;
varying vec2 v_textureCoordinate;
varying vec4 v_param;

uniform mat4 u_mvp;
void main() {
    v_param.z = a_index.x;
    if (a_index.x < 1.0) {
        v_textureCoordinate = a_textureCoordinate;
        gl_Position = a_position;
        v_param.xy = vec2(0.0, 0.0);
        v_param.w = 0.0;
    } else {
        vec4 pt = u_mvp * a_position;
        v_textureCoordinate = a_textureCoordinate / pt.w;
        gl_Position = pt / pt.w;
        v_param.xy = pt.xy / pt.w * 0.5 + 0.5;
        v_param.w = 1.0 / pt.w;
    }
}