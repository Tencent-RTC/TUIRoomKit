Pod::Spec.new do |spec|
 spec.name			= 'TCBeautyKit'
 spec.version		= '1.0.0'
 spec.platform		= :ios
 spec.ios.deployment_target = '11.0'
 spec.license		= { :type => 'Proprietary',
 	:text => <<-LICENSE
 	  copyright 2017 tencent Ltd. All rights reserved.
      LICENSE
 	 }
 spec.homepage		= 'https://cloud.tencent.com/document/product/269/3794'
 spec.documentation_url = 'https://cloud.tencent.com/document/product/269/9147'
 spec.authors		= 'tencent video cloud'
 spec.summary		= 'TCBeautyKit'
 spec.xcconfig      = { 'VALID_ARCHS' => 'armv7 arm64 x86_64' }
 spec.swift_version = '5.0'
 
 spec.dependency 'SSZipArchive'
 spec.dependency 'Toast-Swift'
 
 spec.requires_arc = true
 spec.static_framework = true
 spec.source = { :path => './'}
 spec.source_files = 'Source/*.{h,m,mm,swift}'
 spec.resource_bundles = {
   'TCBeautyKitBundle' => ['Resources/*.{bundle,json,mp4,xcassets}', 'Resources/**/*.strings']
 }
end
