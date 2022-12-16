Pod::Spec.new do |spec|
  spec.name         = 'TUIBeauty'
  spec.version      = '1.0.0'
  spec.platform     = :ios
  spec.ios.deployment_target = '9.0'
  spec.license      = { :type => 'MIT', :file => 'LICENSE' }
  spec.homepage     = 'https://cloud.tencent.com/document/product/269/3794'
  spec.documentation_url = 'https://cloud.tencent.com/document/product/269/9147'
  spec.authors      = 'tencent video cloud'
  spec.summary      = 'TUIBeauty'
  spec.xcconfig     = { 'VALID_ARCHS' => 'armv7 arm64 x86_64' }

  spec.dependency 'Masonry'
  spec.dependency 'SSZipArchive'
  spec.dependency 'TUICore/ImSDK_Scenario'
  
  spec.requires_arc = true
  spec.static_framework = true
  spec.source = { :git => '', :tag => "#{spec.version}" }
  spec.pod_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64'
  }
  spec.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }
  spec.source_files = 'Source/Localized/**/*.{h,m,mm}', 'Source/PublicHeader/*', 'Source/Model/**/*.{h,m,mm,c}', 'Source/Server/**/*.{h,m,mm}', 'Source/UI/**/*.{h,m,mm}', 'Source/TUIExtension/**/*.{h,m,mm}', 'Source/Common/**/*.{h,m,mm}', 'Source/Presenter/**/*.{h,m,mm}'
  spec.public_header_files ='Source/**/Headers/*.h'
  spec.ios.framework = ['AVFoundation', 'Accelerate', 'AssetsLibrary','CoreML', 'JavaScriptCore', 'CoreFoundation', 'MetalPerformanceShaders','CoreTelephony']
  spec.library = 'c++', 'resolv', 'sqlite3'
  spec.resource_bundles = {
    'TUIBeautyKitBundle' => ['Resources/Localized/**/*.strings', 'Resources/*.xcassets', 'Resources/*.bundle', 'Resources/*.mp4', 'Resources/*.json', 'Resources/BeautyResource/*', 'Resources/Xmagic/BeautyRes/*', 'Resources/Xmagic/*.json', 'Resources/Xmagic/*.bundle']
  }

  spec.default_subspec = 'Default'

  spec.subspec 'Default' do |default|
    default.dependency 'XMagic', '2.5.0.250'
  end
  
  spec.subspec 'Smart' do |smart|
    smart.dependency 'XMagic_Smart', '2.5.0.250'
  end
  
end

