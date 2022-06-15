material {
    name : default,
    shadingModel : lit,
    blending : opaque,
    parameters : [
        
    ]
}

fragment {
    void material(inout MaterialInputs material) {
        
        prepareMaterial(material);
        
        material.baseColor = float4(0.5,0.5,0.5,1);
    }
}