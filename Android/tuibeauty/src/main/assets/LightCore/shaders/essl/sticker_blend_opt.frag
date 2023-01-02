precision highp float;
        
varying vec2 v_textureCoordinate;
varying vec4 v_param;

uniform float u_preMultiplied;
uniform float u_alpha;
uniform float u_blendMode;

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;

float v1021(float x, float y)
{
  return 1.0 - (1.0 - x) * (1.0 - y);
}
vec3 f1021(vec3 x,vec3 y)
{
  return vec3(v1021(x.r, y.r), v1021(x.g, y.g), v1021(x.b, y.b));
}
vec3 f1021(vec3 x, vec3 y, float z)
{
  return f1021(x, y) * z + x * (1.0 - z);
}

float v1017(float x, float y)
{
  return x < 0.5 ? 2.0 * x * y: 1.0 - 2.0 * (1.0 - x) * (1.0 - y);
}
vec3 f1017(vec3 x, vec3 y)
{
  return vec3(v1017(x.r, y.r), v1017(x.g, y.g), v1017(x.b, y.b));
}
vec3 f1017(vec3 x, vec3 y, float z)
{
  return f1017(x, y) * z + x * (1.0 - z );
}

void main()
{
    if (v_param.z < 1.0) {
        lowp vec4 tmpvar_2;
        tmpvar_2 = texture2D(u_texture0, v_textureCoordinate);
        gl_FragColor = tmpvar_2;
    } else if (v_param.z < 2.0) {
        lowp vec4 texColor;
        texColor = texture2D(u_texture1, v_textureCoordinate / v_param.w);
        float blendMode = u_blendMode;
        bool preMultiplied = (u_preMultiplied == 1.0);
        float texAlpha = u_alpha;

        vec3 resultFore = texColor.rgb;
        if (preMultiplied && texColor.a > 0.0) {
          texColor.rgb = texColor.rgb / texColor.a;
        }
        vec3 vOne = vec3(1.0, 1.0, 1.0);
        vec3 vZero = vec3(0.0, 0.0, 0.0);
        lowp vec4 canvasColor;
        canvasColor = texture2D(u_texture0, v_param.xy);
        if (blendMode == 2.0) {  //multiply
            resultFore = canvasColor.rgb * texColor.rgb;
          } else if (blendMode == 3.0){    //screen
            vec3 a = vOne - canvasColor.rgb;     
            vec3 b = vOne - texColor.rgb;
            resultFore = vOne - a * b;
          } else if (blendMode == 4.0){    //overlay
            resultFore = 2.0 * canvasColor.rgb * texColor.rgb;
              resultFore.r = step(0.5, canvasColor.r) * (1.0 - 2.0 * (1.0 - canvasColor.r) * (1.0 - texColor.r)) + (1.0 - step(0.5, canvasColor.r)) * resultFore.r;
              resultFore.g = step(0.5, canvasColor.g) * (1.0 - 2.0 * (1.0 - canvasColor.g) * (1.0 - texColor.g)) + (1.0 - step(0.5, canvasColor.g)) * resultFore.g;
              resultFore.b = step(0.5, canvasColor.b) * (1.0 - 2.0 * (1.0 - canvasColor.b) * (1.0 - texColor.b)) + (1.0 - step(0.5, canvasColor.b)) * resultFore.b;
          } else if (blendMode == 5.0){    //hardlight
            resultFore = 2.0 * canvasColor.rgb * texColor.rgb;
              resultFore.r = step(0.5, texColor.r) * (1.0 - 2.0 * (1.0 - canvasColor.r) * (1.0 - texColor.r)) + (1.0 - step(0.5, texColor.r)) * resultFore.r;
              resultFore.g = step(0.5, texColor.g) * (1.0 - 2.0 * (1.0 - canvasColor.g) * (1.0 - texColor.g)) + (1.0 - step(0.5, texColor.g)) * resultFore.g;
              resultFore.b = step(0.5, texColor.b) * (1.0 - 2.0 * (1.0 - canvasColor.b) * (1.0 - texColor.b)) + (1.0 - step(0.5, texColor.b)) * resultFore.b;
          } else if (blendMode == 6.0){    //softlight
            resultFore = 2.0 * canvasColor.rgb * texColor.rgb + canvasColor.rgb * canvasColor.rgb * (vOne - 2.0 * texColor.rgb);
              resultFore.r = step(0.5, texColor.r) * (2.0 * canvasColor.r * (1.0 - texColor.r) + (2.0 * texColor.r - 1.0) * sqrt(canvasColor.r)) + (1.0 - step(0.5, texColor.r)) * resultFore.r;
              resultFore.g = step(0.5, texColor.g) * (2.0 * canvasColor.g * (1.0 - texColor.g) + (2.0 * texColor.g - 1.0) * sqrt(canvasColor.g)) + (1.0 - step(0.5, texColor.g)) * resultFore.g;
              resultFore.b = step(0.5, texColor.b) * (2.0 * canvasColor.b * (1.0 - texColor.b) + (2.0 * texColor.b - 1.0) * sqrt(canvasColor.b)) + (1.0 - step(0.5, texColor.b)) * resultFore.b;
          } else if (blendMode == 7.0){    //divide
            resultFore = vOne;
            if (texColor.r > 0.0) {
              resultFore.r = canvasColor.r / texColor.r;
            }
            if (texColor.g > 0.0) {
              resultFore.g = canvasColor.g / texColor.g;
            }
            if (texColor.b > 0.0) {
              resultFore.b = canvasColor.b / texColor.b;
            }
            resultFore = min(vOne, resultFore);
          } else if (blendMode == 8.0){    //add
            resultFore = canvasColor.rgb + texColor.rgb;
            resultFore = min(vOne, resultFore);
          } else if (blendMode == 9.0){    //substract
             resultFore = canvasColor.rgb - texColor.rgb;
             resultFore = max(vZero, resultFore);
         } else if (blendMode == 10.0){   //diff
             resultFore = abs(canvasColor.rgb - texColor.rgb);
         } else if (blendMode == 11.0){   //darken
             resultFore = min(canvasColor.rgb, texColor.rgb);
         } else if (blendMode == 12.0){   //lighten
             resultFore = max(canvasColor.rgb, texColor.rgb);
         } else if (blendMode == 13.0) {
          if (preMultiplied == false) {
             texColor.rgb = texColor.rgb * texColor.a;
          }
          texColor = texColor * texAlpha;
          gl_FragColor = canvasColor * (1.0 - texColor.a) + texColor;
          return;
        } else if (blendMode == 14.0) {
          if (preMultiplied == false) {
             texColor.rgb = texColor.rgb * texColor.a;
          }
          texColor = texColor * texAlpha;
          vec3 r = f1021(canvasColor.rgb, clamp(texColor.rgb * (1.0 / texColor.a), 0.0, 1.0), 1.0);
          vec3 resultFore = canvasColor.rgb * (1.0 - texColor.a) + r.rgb * texColor.a;
          gl_FragColor = vec4(resultFore, 1.0);
          return;
        } else if (blendMode == 15.0) {
          if (preMultiplied == false) {
             texColor.rgb = texColor.rgb * texColor.a;
          }
          texColor = texColor * texAlpha;
          vec3 r = f1017(canvasColor.rgb, clamp(texColor.rgb * (1.0 / texColor.a), 0.0, 1.0), 1.0);
          vec3 resultFore = canvasColor.rgb * (1.0 - texColor.a) + r.rgb * texColor.a;
          gl_FragColor = vec4(resultFore, 1.0);
          return;
        }
        texColor.a = texColor.a * texAlpha;

        vec4 c = vec4(resultFore.rgb * texColor.a, texColor.a);
        gl_FragColor = c + canvasColor * (1.0 - c.a);

    }

}