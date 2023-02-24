precision lowp float;
attribute vec4 a_position;
attribute vec2 a_textureCoordinate;
attribute vec2 a_index;
varying lowp vec3 v_param;
uniform mat4 u_mvp;
void main() {
    v_param.z = a_index.x;
    v_param.xy = a_textureCoordinate;
    if (a_index.x < 1.0) {
        gl_Position = a_position;
    } else {
        vec4 pt = u_mvp * a_position;
        gl_Position = pt / pt.w;
    }
}