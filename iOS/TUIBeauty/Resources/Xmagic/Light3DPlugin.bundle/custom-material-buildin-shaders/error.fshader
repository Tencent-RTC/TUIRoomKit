material {
    name : studio_error_shader,
    shadingModel : unlit,
    blending : opaque,
    parameters : [
    {
        type : int,
        name : error
     }
    ]
}

fragment {
    void material(inout MaterialInputs material) {
        prepareMaterial(material);
        material.baseColor = float4(0.8431, 0, 0.2509, 1.0);
    }
}