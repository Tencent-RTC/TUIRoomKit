#pragma OPENCL EXTENSION cl_khr_fp16 : enable
__kernel void gy_change_style_preprocess_pack_v4(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __write_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                 __global uchar *input_camera,
                                 __global uchar *input_style) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);
  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int channel_cl = image_width_idx / width;
  const int offset_input = (image_height_idx * width + image_width_idx % width)*4;
  uchar4 input_camera4 = vload4(0, input_camera + offset_input);
  uchar4 input_style4 = vload4(0, input_style + offset_input);
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 values4 = convert_half4(input_camera4)/255.0h;
  half4 values4_style = convert_half4(input_style4)/255.0h;
  values4 = values4 * 2.0h - 1.0h;
  values4_style = values4_style *2.0h - 1.0h;
  if(channel_cl == 0){
    values4_style.w = values4.x;
  }else {
    values4_style.x = values4.y;
    values4_style.y = values4.z;
    values4_style.zw = 0.0h;
  }
  write_imageh(input_ptr, coord, values4_style);
};
__kernel void gy_change_style_postprocess2A(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __read_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                  __read_only image2d_t input_ptr_2,
                                 __private const int channel_up_4_2,
                                 __private const int height_2,
                                 __private const int width_2,
                                 __global uchar *output,//1st output
                                 __global uchar *input_style) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);
  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int batch_idx = image_height_idx / height;
  const int height_idx = image_height_idx % height;
  const int width_idx = image_width_idx % width;
  int channel_block_idx = image_width_idx / width;

  int buffer_offset =
      (((batch_idx * channel_up_4 + channel_block_idx) * height + height_idx) *
           width +
       width_idx) *
      4;
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 half4_1 = read_imageh(input_ptr, SAMPLER, coord);
  half4 half4_2 = read_imageh(input_ptr_2, SAMPLER, coord);
  half alpha = clamp(half4_2.x, 0.0h, 1.0h);
  half4_1 = (half4_1 + 1.0h) / 2.0h; 
  half4_1 = clamp(half4_1, 0.0h, 1.0h);

  half4_1.w = 1.0h - alpha;
  half4_1.xyz = clamp(half4_1.xyz, 0.0h, 1.0h) * half4_1.w;

  uchar4 values4 = convert_uchar4_sat(half4_1 * 255.0h);
  vstore4(values4, 0, output + buffer_offset);
};
__kernel void gender_style_preprocess(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __write_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                 __global uchar *input_camera) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);

  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int channel_cl = image_width_idx / width;
  const int offset_input = (image_height_idx * width + image_width_idx % width)*4;
  uchar4 input_camera4 = vload4(0, input_camera + offset_input);
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 values4 = convert_half4(input_camera4);
  write_imageh(input_ptr, coord, values4);
};
__kernel void gender_style_postprocess(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __read_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                 __global uchar *output) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);
  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int batch_idx = image_height_idx / height;
  const int height_idx = image_height_idx % height;
  const int width_idx = image_width_idx % width;
  int channel_block_idx = image_width_idx / width;

  int buffer_offset =
      (((batch_idx * channel_up_4 + channel_block_idx) * height + height_idx) *
           width +
       width_idx) *
      4;
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 half4_1 = read_imageh(input_ptr, SAMPLER, coord);
  uchar4 values4 = convert_uchar4_sat(half4_1);
  vstore4(values4, 0, output + buffer_offset);
};

#pragma OPENCL EXTENSION cl_khr_fp16 : enable
__kernel void gy_style_preprocess_1in_scale2(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __write_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                 __global uchar *input_camera) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);

  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int channel_cl = image_width_idx / width;
  const int offset_input = (image_height_idx * width + image_width_idx % width)*4;
  uchar4 input_camera4 = vload4(0, input_camera + offset_input);
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 values4 = convert_half4(input_camera4)/255.0h;
  values4 = values4 * 2.0h - 1.0h;
  write_imageh(input_ptr, coord, values4);
};
__kernel void gy_style_postprocess_2out_scale2(__private const int global_size_dim0,
                                 __private const int global_size_dim1,
                                 __read_only image2d_t input_ptr,
                                 __private const int channel_up_4,
                                 __private const int height,
                                 __private const int width,
                                  __read_only image2d_t input_ptr_2,
                                 __private const int channel_up_4_2,
                                 __private const int height_2,
                                 __private const int width_2,
                                 __global uchar *output) {
  __const sampler_t SAMPLER =
      CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;
  int image_width_idx = get_global_id(0);
  int image_height_idx = get_global_id(1);
  if (image_width_idx >= global_size_dim0 ||
      image_height_idx >= global_size_dim1) {
      return;
  }
  const int batch_idx = image_height_idx / height;
  const int height_idx = image_height_idx % height;
  const int width_idx = image_width_idx % width;
  int channel_block_idx = image_width_idx / width;

  int buffer_offset =
      (((batch_idx * channel_up_4 + channel_block_idx) * height + height_idx) *
           width +
       width_idx) *
      4;
  int2 coord = (int2)(image_width_idx, image_height_idx);
  half4 half4_1 = read_imageh(input_ptr, SAMPLER, coord);
  half4 half4_2 = read_imageh(input_ptr_2, SAMPLER, coord);
  half alpha = clamp(half4_2.x, 0.0h, 1.0h);
  half4_1 = (half4_1 + 1.0h) / 2.0h;
  half4_1 = clamp(half4_1, 0.0h, 1.0h) * alpha;
  half4_1.w = alpha;
  uchar4 values4 = convert_uchar4_sat(half4_1 * 255.0h);
  vstore4(values4, 0, output + buffer_offset);
};
