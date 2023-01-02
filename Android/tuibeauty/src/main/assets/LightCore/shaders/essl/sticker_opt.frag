precision lowp float;

varying lowp vec3 v_param;

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform sampler2D u_texture3;
uniform sampler2D u_texture4;
uniform sampler2D u_texture5;
uniform sampler2D u_texture6;
uniform sampler2D u_texture7;



void main()
{
    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
    if (v_param.z < 1.0) {
      color = texture2D(u_texture0, v_param.xy);
    } else if (v_param.z < 2.0) {
      color = texture2D(u_texture1, v_param.xy);
    } else if (v_param.z < 3.0) {
      color = texture2D(u_texture2, v_param.xy);
    } else if (v_param.z < 4.0) {
      color = texture2D(u_texture3, v_param.xy);
    } else if (v_param.z < 5.0) {
      color = texture2D(u_texture4, v_param.xy);
    } else if (v_param.z < 6.0) {
      color = texture2D(u_texture5, v_param.xy);
    } else if (v_param.z < 7.0) {
      color = texture2D(u_texture6, v_param.xy);
    } else if (v_param.z < 8.0) {
      color = texture2D(u_texture7, v_param.xy);
    }

    gl_FragColor = color;
}