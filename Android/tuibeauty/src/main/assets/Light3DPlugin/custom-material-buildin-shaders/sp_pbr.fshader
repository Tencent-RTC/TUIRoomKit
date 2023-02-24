material {
    name : sp_pbr,
    requires : [ uv0],
    shadingModel : lit,
    blending : opaque,
    depthWrite : true,
    culling: back,
    doubleSided : false,
    flipUV : false,
    customPostEffect : true,
    parameters : [
        {
            type : float4,
            name : baseColorFactor,
            ls_editor : {
              defaultValue: [1,1,1,1],
              uiType: "color",
              label:"颜色"
            }
        },
        {
            type : bool,
            name : baseColorEnableTexture,
            ls_editor : {
              defaultValue: false,
              label:"颜色纹理"
            }
        },
        {
            type : sampler2d,
            name : baseColorMap,
            ls_editor : {
              defaultValue: "",
              showIfKey: "baseColorEnableTexture",
              uiType: "file",
              label:" - 贴图",
              fileType: ["ImageData", "PAGFileData", "RenderTarget", "EnvMap_KTX"]
            }
        },
        {
            type : bool,
            name : metallicRoughnessAOEnableTexture,
            ls_editor : {
              defaultValue: false,
              label: "金属度粗糙度AO纹理"
            }
        },
        {
            type : sampler2d,
            name : metallicRoughnessAOMap,
            ls_editor : {
              defaultValue: "",
              showIfKey: "metallicRoughnessAOEnableTexture",
              uiType: "file",
              label:" - 贴图",
              fileType: ["ImageData", "PAGFileData", "RenderTarget", "EnvMap_KTX"]
            }
        },
        {
            type : float,
            name : metallicFactor,
            ls_editor : {
              defaultValue: 1.0,
              showIf: [{
                metallicRoughnessAOEnableTexture: [false],
              }],
              uiType:"float",
              label: "金属度",
              numberStep: 0.01,
              numberRangeFrom: 0,
              numberRangeTo: 1
            }
        },
        {
            type : float,
            name : roughnessFactor,
            ls_editor : {
              defaultValue: 1.0,
              showIf: [{
                metallicRoughnessAOEnableTexture: [false],
              }],
              uiType:"float",
              label: "粗糙度",
              numberStep: 0.01,
              numberRangeFrom: 0,
              numberRangeTo: 1.0
            }
        },
         {
            type : bool,
            name : normalEnableTexture,
            ls_editor : {
              defaultValue: false,
              label: "法线纹理"
            }
        },
        {
            type : sampler2d,
            name : normalMap,
            ls_editor : {
              defaultValue: "",
              showIfKey: "normalEnableTexture",
              uiType: "file",
              label:" - 贴图",
              fileType: ["ImageData", "PAGFileData", "RenderTarget", "EnvMap_KTX"]
            }
        },
        {
            type : sampler2d,
            name : diffuse_tex,
            ls_editor : {
              defaultValue: "",
              uiType: "file",
              label:"漫反射贴图",
              fileType: ["ImageData", "PAGFileData", "RenderTarget", "EnvMap_KTX"]
            }
        },
       {
            type : sampler2d,
            name : specular_tex,
            ls_editor : {
              defaultValue: "",
              uiType: "file",
              label:"环境高光贴图",
              fileType: ["ImageData", "PAGFileData", "RenderTarget", "EnvMap_KTX"]
            }
        },
        {
            type : float,
            name : envRotation,
            ls_editor : {
              defaultValue: 0,
              uiType:"float",
              label: "环境光旋转",
              numberStep: 1,
              numberRangeFrom: 0,
              numberRangeTo: 360
            }
        },
        {
            type : float,
            name : envExposure,
            ls_editor : {
              defaultValue: 0,
              uiType:"float",
              label: "曝光",
              numberStep: 0.01,
              numberRangeFrom: -10,
              numberRangeTo: 10
            }
        },
        {
            type : float2,
            name : EnvmapSpecularSize,
            ls_editor : {
              label: "EnvmapSpecularSize",
              defaultValue: [512.0, 256.0]
            }
        },
        {
            type : int,
            name : toneMapping,
            ls_editor : {
              defaultValue: 0,
              uiType: "enum",
              enum: [{
                  label:"ACES",
                  value: 0
              },{
                  label:"Linear",
                  value: 1
              },{
                  label:"Reinhard",
                  value: 2
              },{
                  label:"不使用HDR",
                  value: 3
              }],
              label:"ToneMapping"
            }
        }
    ],
    variables : [
      UserWorldNormal,
      UserWorldPosition
    ]
}

vertex {

    void materialVertex(inout MaterialVertexInputs material) {

        material.UserWorldNormal.xyz = material.worldNormal;
        material.UserWorldPosition.xyz = material.worldPosition.xyz;
    }
}



fragment {
    #define SC_EPSILON 1e-6

    struct SurfaceProperties {
      vec3 albedo;
      float opacity;
      vec3 normal;
      float metallic;
      float roughness;
      vec3 emissive;
      vec3 ao;
      vec3 specularAo;
      vec3 bakedShadows;
      vec3 specColor;
    };
    struct LightingComponents {
      vec3 directDiffuse;
      vec3 directSpecular;
      vec3 indirectDiffuse;
      vec3 indirectSpecular;
      vec3 emitted;
      vec3 transmitted;
    };
    struct LightProperties {
      vec3 direction;
      vec3 color;
      float attenuation;
    };

    SurfaceProperties defaultSurfaceProperties() {
      SurfaceProperties surfaceProperties;
      surfaceProperties.albedo = vec3(0.0);
      surfaceProperties.opacity = 1.0;
      surfaceProperties.normal = vec3(0.0);
      surfaceProperties.metallic = 0.0;
      surfaceProperties.roughness = 0.0;
      surfaceProperties.emissive = vec3(0.0);
      surfaceProperties.ao = vec3(1.0);
      surfaceProperties.specularAo = vec3(1.0);
      surfaceProperties.bakedShadows = vec3(1.0);
      return surfaceProperties;
    }

    LightingComponents defaultLightingComponents() {
      LightingComponents lighting;
      lighting.directDiffuse = vec3(0.0);
      lighting.directSpecular = vec3(0.0);
      lighting.indirectDiffuse = vec3(1.0);
      lighting.indirectSpecular = vec3(0.0);
      lighting.emitted = vec3(0.0);
      lighting.transmitted = vec3(0.0);
      return lighting;
    }

    //global variables
    vec2 g_uv;

    // utils function
    float _atan2(float x, float y) {
      float signx = x < 0.0 ? -1.0 : 1.0;
      return signx * acos(clamp(y / length(vec2(x, y)), -1.0, 1.0));
    }
    float User_srgbToLinear(float x) { return pow(x, 2.2); }
    float User_linearToSrgb(float x) { return pow(x, 1.0 / 2.2); }
    vec3 User_srgbToLinear(vec3 color) {
      return vec3(User_srgbToLinear(color.r), User_srgbToLinear(color.g), User_srgbToLinear(color.b));
    }
    vec3 User_linearToSrgb(vec3 color) {
      return vec3(User_linearToSrgb(color.r), User_linearToSrgb(color.g), User_linearToSrgb(color.b));
    }
    vec2 calcPanoramicTexCoordsFromDir(vec3 reflDir, float rotationDegrees) {
      vec2 uv;
      uv.x = _atan2(reflDir.x, -reflDir.z) - PI / 2.0;
      uv.y = acos(reflDir.y);
      uv = uv / vec2(2.0 * PI, PI);
      uv.y = 1.0 - uv.y;
      uv.x += rotationDegrees / 360.0;
      uv.x = fract(uv.x + floor(uv.x) + 1.0);
      return uv;
    }
    vec3 pow3(vec3 color, float x){
      color.r = pow(color.r, x);
      color.g = pow(color.g, x);
      color.b = pow(color.b, x);
      return color;
    }

    float powN(float value, float n){
      float res = 1.0;
      for(float i=0.0;i<n;i++){
        res *= value;        
      }
      return res;
    }

    // ------------ tone mapping ------------
    vec3 User_linearToneMapping(vec3 x) {
      float a = 1.8;
      float b = 1.4;
      float c = 0.5;
      float d = 1.5;
      return (x * (a * x + b)) / (x * (a * x + c) + d);
    }

    vec3 User_acesToneMapping(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return (x * (a * x + b)) / (x * (c * x + d) + e);
    }

    vec3 User_Reinhard(vec3 x) {
      return x / (1.0 + luminance(x));
    }




    // ------------ read Tex function -----------
    // read specular mipmap texture from a large texture
    vec4 sampleSpecularEnvTextureFromMipmap(vec2 uv, float lod) {
      uv.y = 1.0 - uv.y;
      // lod = 2.0;
      if (lod < 1.0) {
        uv.y = uv.y * 0.5;
        return texture(materialParams_specular_tex, uv);
      } else if (lod < 2.0) {
        uv.x = uv.x * 0.5;
        uv.y = 0.5 + (0.75 - 0.5) * uv.y;
        return texture(materialParams_specular_tex, uv);
      } else if (lod < 3.0) {
        uv.x = uv.x *0.25;
        uv.y = 0.75 + (0.875 - 0.75) * uv.y;
        return texture(materialParams_specular_tex, uv);
      } else if (lod < 4.0) {
        uv.x = uv.x * 0.125;
        uv.y = 0.875 + (0.9375 - 0.875) * uv.y;
        return texture(materialParams_specular_tex, uv);
      } else {
        uv.x = uv.x * 0.0625;
        uv.y = 0.9375 + (0.96875 - 0.9375) * uv.y;
        return texture(materialParams_specular_tex, uv);
      }
    }

    vec2 calcSeamlessPanoramicUvsForConvolution(vec2 uv, vec2 topMipRes, float lod) {
      vec2 thisMipRes = max(vec2(1.0), topMipRes / vec2(exp2(lod)));
      return (uv * thisMipRes - 0.5) / (thisMipRes - 1.0);
    }
    vec2 calcSeamlessPanoramicUvsForSampling(vec2 uv, vec2 topMipRes, float lod) {
      vec2 thisMipRes = max(vec2(1.0), topMipRes / vec2(exp2(lod)));
      return uv * (thisMipRes - 1.0) / thisMipRes + 0.5 / thisMipRes;
    }

    vec4 emulateTexture2DLod(vec2 textureSize, vec2 uv, float lod) {
      // vec2 texels = uv * textureSize;
      // float dudx = dFdx(texels.x);
      // float dvdx = dFdx(texels.y);
      // float dudy = dFdy(texels.x);
      // float dvdy = dFdy(texels.y);
      // float mu = max(abs(dudx), abs(dudy));
      // float mv = max(abs(dvdx), abs(dvdy));
      // float rho2 = max(mu, mv);
      // float mip = log2(rho2);
      // float bias = lod - mip;

      vec4 color = sampleSpecularEnvTextureFromMipmap(uv, lod);//bias
      color.rgb = color.rgb * color.a * 16.0;
      color.rgb *= color.rgb;

      return color;
    }


    vec4 sampleSpecularEnvTextureLod(vec2 uv, float lod) {
      return emulateTexture2DLod(materialParams.EnvmapSpecularSize.xy, uv, lod);
    }

    vec3 sampleSpecularEnvTextureLod(vec3 R, float lod) {
      highp vec2 uv = calcPanoramicTexCoordsFromDir(R, materialParams.envRotation);
      float lodFloor = floor(lod);
      float lodCeil = ceil(lod);
      float lodFrac = lod - lodFloor;
      vec2 uvFloor = calcSeamlessPanoramicUvsForSampling(uv, materialParams.EnvmapSpecularSize.xy, lodFloor);
      vec4 texFloor = sampleSpecularEnvTextureLod(uvFloor, lodFloor);
      vec2 uvCeil = calcSeamlessPanoramicUvsForSampling(uv, materialParams.EnvmapSpecularSize.xy, lodCeil);
      vec4 texCeil = sampleSpecularEnvTextureLod(uvCeil, lodCeil);
      vec4 tex = mix(texFloor, texCeil, lodFrac);
      return tex.rgb;
    }


    // sub function
    SurfaceProperties setupSurfaceProperties(vec2 uv) {
      vec3 V = normalize(getWorldCameraPosition() - getWorldPosition().xyz);
      SurfaceProperties surfaceProperties = defaultSurfaceProperties();

      // base color
      highp vec4 albedo = materialParams.baseColorFactor;
      if (materialParams.baseColorEnableTexture) {
        albedo = texture(materialParams_baseColorMap, uv);
      }
      surfaceProperties.albedo = User_srgbToLinear(albedo.rgb);
      surfaceProperties.opacity = 1.0;

      if (materialParams.normalEnableTexture) {
        mat3 tangentFrame = getWorldTangentFrame();
        float3 N = normalize(variable_UserWorldNormal.xyz);
        float3 T = normalize(tangentFrame[0]);
        float3 BT = normalize(cross(N, T));
        mat3 TBN = mat3(T, BT, N);
        highp vec3 normalColor = texture(materialParams_normalMap, uv).rgb * (255.0/128.0) - 1.0;
        surfaceProperties.normal = normalize(TBN * normalColor);
      } else {
        surfaceProperties.normal = normalize(variable_UserWorldNormal.xyz);
      }

      /// metallic & roughness & ao
      highp vec4 color = vec4(1.0);
      if (materialParams.metallicRoughnessAOEnableTexture){
        color = texture(materialParams_metallicRoughnessAOMap, uv);
        surfaceProperties.metallic = color.r ;
        surfaceProperties.roughness = color.g ;
        surfaceProperties.ao = vec3(color.b) * 0.75;
      } else {
        surfaceProperties.metallic = materialParams.metallicFactor ;
        surfaceProperties.roughness = materialParams.roughnessFactor ;
        surfaceProperties.ao = vec3(1.0f);
      }
      return surfaceProperties;
    }

    void deriveAlbedoAndSpecColorFromSurfaceProperties(in SurfaceProperties surfaceProperties,
                                                   out vec3 albedo, out vec3 specColor) {
      specColor = mix(vec3(0.04), surfaceProperties.albedo * surfaceProperties.metallic,
                  surfaceProperties.metallic);
      albedo = mix(surfaceProperties.albedo * (1.0 - surfaceProperties.metallic), vec3(0.0),
               surfaceProperties.metallic);
    }

    SurfaceProperties calculateDerivedSurfaceProperties(SurfaceProperties surfaceProperties) { 
      deriveAlbedoAndSpecColorFromSurfaceProperties(surfaceProperties, surfaceProperties.albedo,
                                                surfaceProperties.specColor);
      return surfaceProperties;
    }

    // diffuse IBL
    vec3 calculateIndirectDiffuse(vec3 N) {
      vec3 accumulatedLight = vec3(0.0);
      vec2 uv = calcPanoramicTexCoordsFromDir(N, materialParams.envRotation);
      uv = calcSeamlessPanoramicUvsForSampling(uv, vec2(64, 32.0), 0.0);
      float offset = -13.0;
      uv.y = 1.0 - uv.y;
      vec4 tex = texture(materialParams_diffuse_tex, uv, offset);
      tex.rgb = tex.rgb * tex.a * 16.0;
      tex.rgb *= tex.rgb;
      tex.rgb = pow3(tex.rgb, 1.0/2.2);
      accumulatedLight = tex.rgb * pow(2.0, materialParams.envExposure);
      accumulatedLight.r += SC_EPSILON;
      return accumulatedLight;
    }

    // specular IBL
    vec3 envBRDFApprox(SurfaceProperties surfaceProperties, float NdotV) {
      const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
      const vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
      vec4 rr = surfaceProperties.roughness * c0 + c1;
      float a004 = min(rr.x * rr.x, exp2(-9.28 * NdotV)) * rr.x + rr.y;
      vec2 AB = vec2(-1.04, 1.04) * a004 + rr.zw;
      AB.y *= saturate( 50.0 * surfaceProperties.specColor.g );
      vec3 BRDF = max(surfaceProperties.specColor * AB.x + AB.y, vec3(0.0));
      return BRDF;
    }
    vec3 calculateIndirectSpecular(SurfaceProperties surfaceProperties, vec3 V) {
      // Env Map
      vec3 N = surfaceProperties.normal;
      vec3 R = reflect(-V, N);
      float lerpFactor = powN(surfaceProperties.roughness, 5.0);
      R = normalize(mix(R, N, lerpFactor));
      const float RoughnessExponentInv = 1.0 / 1.5;
      const float MaxRoughnessMip = 5.0;
      float mip = saturate(pow(surfaceProperties.roughness, RoughnessExponentInv)) * MaxRoughnessMip;
      vec3 envmap = sampleSpecularEnvTextureLod(R, mip) * pow(2.0, materialParams.envExposure);

      // Env BRDF
      float NdotV = abs(dot(N, V));
      vec3 BRDF = envBRDFApprox(surfaceProperties, NdotV);

      return envmap * BRDF;
    }

    // only IBL, temp
    LightingComponents evaluateLighting(SurfaceProperties surfaceProperties) {
        LightingComponents lighting = defaultLightingComponents();
        vec3 V = normalize(getWorldCameraPosition() - getWorldPosition().xyz);
        lighting.indirectDiffuse = calculateIndirectDiffuse(surfaceProperties.normal);
        lighting.indirectSpecular = calculateIndirectSpecular(surfaceProperties, V) + vec3(0.001);
        return lighting;
    }

    // combine with lighting
    vec3 combineSurfacePropertiesWithLighting(SurfaceProperties surfaceProperties,
                                          LightingComponents lighting) {
                                            vec3 diffuse = surfaceProperties.albedo * (lighting.directDiffuse + lighting.indirectDiffuse * surfaceProperties.ao);
                                            vec3 specular = lighting.directSpecular + lighting.indirectSpecular * surfaceProperties.specularAo;
                                            vec3 emitted = surfaceProperties.emissive;
                                            vec3 transmitted = lighting.transmitted;
                                            vec3 result = diffuse + specular + emitted + transmitted;
                                            return result;
                                          }


    void material(inout MaterialInputs material) {
        material.normal = float3(1.0);
        prepareMaterial(material);
    }

    // main function
    void postEffect(MaterialInputs material, inout vec4 color) {
        highp vec2 uv = getUV0();
        g_uv = uv;

        SurfaceProperties surfaceProperties = setupSurfaceProperties(uv);
        surfaceProperties = calculateDerivedSurfaceProperties(surfaceProperties);
        LightingComponents lighting = evaluateLighting(surfaceProperties);
        vec4 result = vec4(combineSurfacePropertiesWithLighting(surfaceProperties, lighting), surfaceProperties.opacity);

        if (materialParams.toneMapping == 0){
          result.rgb = User_acesToneMapping(result.rgb);
        } else if (materialParams.toneMapping == 1){
          result.rgb = User_linearToneMapping(result.rgb);
        } else if (materialParams.toneMapping == 2){
          result.rgb = User_Reinhard(result.rgb);
        } 


        result.rgb = User_linearToSrgb(result.rgb);
        color = result;
    }
}