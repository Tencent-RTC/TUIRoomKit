
Pod::Spec.new do |spec|
  spec.name                  = 'TUIRoomKit'
  spec.version               = '1.0.4'
  spec.platform              = :ios
  spec.ios.deployment_target = '11.0'
  spec.license               = { :type => 'MIT', :file => 'LICENSE' }
  spec.homepage              = 'https://cloud.tencent.com/document/product/269/3794'
  spec.documentation_url     = 'https://cloud.tencent.com/document/product/269/9147'
  spec.authors               = 'tencent video cloud'
  spec.summary               = 'A short description of TUIRoomKit.'
  
  spec.static_framework = true
  spec.xcconfig      = { 'VALID_ARCHS' => 'armv7 arm64 x86_64' }
  spec.swift_version = '5.0'

  spec.source                = { :path => './' }
  
  spec.dependency 'SnapKit'
  spec.dependency 'TUICore', '~> 7.0.3770'
  
  spec.default_subspec = 'TRTC'
  
  spec.subspec 'Professional' do |professional|
    professional.dependency 'TUIRoomEngine/Professional', '~> 1.0.1'
    professional.source_files = 'Source/*.swift', 'Source/Presenter/*.swift', 'Source/**/*.swift', 'Source/**/*.h', 'Source/**/*.m'
    professional.resource_bundles = {
      'TUIRoomKitBundle' => ['Resources/*.xcassets', 'Resources/Localized/**/*.strings']
    }
    professional.pod_target_xcconfig = {'OTHER_SWIFT_FLAGS' => '-D TXLiteAVSDK_Professional', 'GCC_PREPROCESSOR_DEFINITIONS' => 'TXLiteAVSDK_Professional=1'}
  end
  
  spec.subspec 'TRTC' do |trtc|
    trtc.dependency 'TUIRoomEngine/TRTC', '~> 1.0.1'
    trtc.source_files = 'Source/*.swift', 'Source/Presenter/*.swift', 'Source/**/*.swift', 'Source/**/*.h', 'Source/**/*.m'
    trtc.resource_bundles = {
      'TUIRoomKitBundle' => ['Resources/*.xcassets', 'Resources/Localized/**/*.strings']
    }
    trtc.pod_target_xcconfig = {'OTHER_SWIFT_FLAGS' => '-D TXLiteAVSDK_TRTC', 'GCC_PREPROCESSOR_DEFINITIONS' => '$(inherited) COCOAPODS=1 TXLiteAVSDK_TRTC=1'}
  end
  
end
