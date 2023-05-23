//
//  TUIBeautyExtension.m
//  TUIBeauty
//
//  Created by gg on 2021/9/28.
//

#import "TUIBeautyExtension.h"
#import "TUICore.h"
#import "TUIDefine.h"
#import "TUIBeautyView.h"
#import "TUIBeautyExtensionView.h"
#import "NSDictionary+TUISafe.h"

@interface TUIBeautyExtension () <TUIExtensionProtocol, TUIServiceProtocol>

@end

@implementation TUIBeautyExtension

/// 注册美颜组件
+ (void)load {
    [TUICore registerExtension:TUICore_TUIBeautyExtension_Extension object:[TUIBeautyExtension sharedInstance]];
    [TUICore registerExtension:TUICore_TUIBeautyExtension_BeautyView object:[TUIBeautyExtension sharedInstance]];
#ifdef TUICore_TUIBeautyService
    [TUICore registerService:TUICore_TUIBeautyService object:[TUIBeautyExtension sharedInstance]];
#endif
}

+ (instancetype)sharedInstance {
    static TUIBeautyExtension *service = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        service = [[self alloc] init];
    });
    return service;
}

#pragma mark - TUIServiceProtocol
- (id)onCall:(NSString *)method param:(NSDictionary *)param {
#ifdef TUICore_TUIBeautyService_ProcessVideoFrame
    if ([method isEqualToString:TUICore_TUIBeautyService_ProcessVideoFrame]) {
        NSNumber *textureId = param[TUICore_TUIBeautyService_ProcessVideoFrame_SRCTextureIdKey];
        NSNumber *textureWidth = param[TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameWidthKey];
        NSNumber *textureHeight = param[TUICore_TUIBeautyService_ProcessVideoFrame_SRCFrameHeightKey];
        if (textureId && textureWidth && textureHeight) {
            int result = [[TUIBeautyView getBeautyService] processVideoFrameWithTextureId:textureId.intValue textureWidth:textureWidth.intValue textureHeight:textureHeight.intValue];
            return [NSNumber numberWithInt:result];
        }
    }
#endif
#ifdef TUICore_TUIBeautyService_SetLicense
    if ([method isEqualToString:TUICore_TUIBeautyService_SetLicense]) {
        NSString *licenseUrl = param[TUICore_TUIBeautyExtension_BeautyView_LicenseUrl];
        NSString *licenseKey = param[TUICore_TUIBeautyExtension_BeautyView_LicenseKey];
        if (licenseUrl && [licenseUrl isKindOfClass:[NSString class]] && licenseKey && [licenseKey isKindOfClass:[NSString class]]) {
            [[TUIBeautyView getBeautyService] setLicenseUrl:licenseUrl key:licenseKey completion:^(NSInteger authResult, NSString * _Nonnull errorMsg) {
                NSLog(@"XMagic setLicense authResult:%zd, errorMsg:%@", authResult, errorMsg);
            }];
            return nil;
        }
    }
#endif
    return nil;
}

#pragma mark - TUIExtensionProtocol
- (NSArray<TUIExtensionInfo *> *)onGetExtension:(NSString *)key param:(NSDictionary *)param {
    NSMutableArray<TUIExtensionInfo *> *resultExtensionInfoList = [NSMutableArray array];
    if (!key || ![param isKindOfClass:[NSDictionary class]]) {
        return nil;
    }
    if ([key isEqualToString:TUICore_TUIBeautyExtension_BeautyView]) {
        id beautyManager = [param tui_objectForKey:TUICore_TUIBeautyExtension_BeautyView_BeautyManager asClass:[NSObject class]];
        if (!beautyManager || ![beautyManager isKindOfClass:NSClassFromString(@"TXBeautyManager")]) {
            return nil;
        }
        TUIBeautyView *beautyView = [[TUIBeautyView alloc] initWithBeautyManager:beautyManager];
        id beautyService = [TUIBeautyView getBeautyService];
        
        NSDictionary *info = @{TUICore_TUIBeautyExtension_BeautyView_View: beautyView,
                               TUICore_TUIBeautyExtension_BeautyView_DataProcessDelegate: beautyService};
        TUIExtensionInfo *resultExtensionInfo = [[TUIExtensionInfo alloc] init];
        resultExtensionInfo.data = info;
        [resultExtensionInfoList addObject:resultExtensionInfo];

        return resultExtensionInfoList;
    } else if ([key isEqualToString:TUICore_TUIBeautyExtension_Extension]) {
        NSDictionary *info = @{TUICore_TUIBeautyExtension_Extension_View : [TUIBeautyExtensionView getExtensionView]};
        TUIExtensionInfo *resultExtensionInfo = [[TUIExtensionInfo alloc] init];
        resultExtensionInfo.data = info;
        [resultExtensionInfoList addObject:resultExtensionInfo];

        return resultExtensionInfoList;
    }
    return nil;
}
@end
