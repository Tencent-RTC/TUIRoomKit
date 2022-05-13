material {
    name : unlit_fade,
    requires : [ uv0, uv1, color ],
    shadingModel : unlit,
    blending : fade,
    depthWrite : true,
    doubleSided : false,
    flipUV : false,
    specularAmbientOcclusion: simple,
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
            type : int,
            name : baseColorIndex,
            ls_editor : {
              defaultValue: 0,
              uiType: "enum",
              showIfKey: "baseColorEnableTexture",
              enum: [{
                  label:"UV0",
                  value: 0
              },{
                  label:"UV1",
                  value: 1
              }],
              label:" - UV集"
            }
        },
        {
            type : mat3,
            name : baseColorUvMatrix,
            ls_editor : {
              defaultValue: [1,0,0,0,1,0,0,0,1],
              uiHidden: true
            }
        },
        {
            type : bool,
            name : baseColorTexturePremultiplied,
            ls_editor : {
              defaultValue: false,
              showIfKey: "baseColorEnableTexture",
              label:" - 已预乘"
            }
        }
    ]
}

fragment {
    void material(inout MaterialInputs material) {
        highp float2 uvs[2];
        uvs[0] = getUV0();
        uvs[1] = getUV1();

        prepareMaterial(material);
        material.baseColor = materialParams.baseColorFactor;

        if (materialParams.baseColorEnableTexture) {
            highp float2 uv = uvs[materialParams.baseColorIndex];
            uv = (vec3(uv, 1.0) * materialParams.baseColorUvMatrix).xy;
            material.baseColor *= texture(materialParams_baseColorMap, uv);
        }
        #if defined(BLEND_MODE_TRANSPARENT)
        if (!materialParams.baseColorTexturePremultiplied) {
          material.baseColor.rgb *= material.baseColor.a;
        }
        #endif
        material.baseColor *= getColor();
    }
}