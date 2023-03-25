//
//  TUIBeautyService.m
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import "TUIBeautyService.h"
#import "XMagic.h"
#import "TESign.h"
#import "TELicenseCheck.h"

#import "TUIBeautyDownloader.h"
#import "TUIBeautyModel.h"
#import "BeautyLocalized.h"
@interface TUIBeautyService ()<YTSDKEventListener, YTSDKLogListener>

@property (nonatomic, strong) XMagic *xMagicKit;

@property (nonatomic, assign) CGSize renderSize;

@end

@implementation TUIBeautyService

#pragma mark - Init
static TUIBeautyService *sharedService = nil;
+ (instancetype)sharedInstance {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedService = [[TUIBeautyService alloc] init];
    });
    return sharedService;
}

- (instancetype)init {
    if (self = [super init]) {
        _renderSize = CGSizeZero;
        [self.xMagicKit registerSDKEventListener:self];
        [self.xMagicKit registerLoggerListener:self withDefaultLevel:YT_SDK_VERBOSE_LEVEL];
    }
    return self;
}

#pragma mark - Public

- (void)configPropertyWith:(TUIBeautyBaseItem *)beautyBaseItem {
    __weak typeof(self) weakSelf = self;
    switch (beautyBaseItem.type) {
        case TUIBeautyTypeBeauty:
            [self configPropertyWithType:@"beauty" withName:beautyBaseItem.key withData:[NSString stringWithFormat:@"%f",beautyBaseItem.currentValue] withExtraInfo:beautyBaseItem.extraConfig];
            break;
        case TUIBeautyTypeFilter:
            [self configPropertyWithType:@"lut" withName:[@"lut.bundle/" stringByAppendingPathComponent:beautyBaseItem.path] withData:[NSString stringWithFormat:@"%f",beautyBaseItem.currentValue] withExtraInfo:nil];
            break;
        case TUIBeautyTypeMotion:{
            [self loadResourceWithItem:beautyBaseItem complete:^(BOOL isSuccess, NSString * _Nonnull msg) {
                if (!weakSelf || !isSuccess) {
                    return;
                }
                [weakSelf configPropertyWithType:@"motion" withName:[beautyBaseItem key] withData:[[TUIBeautyDownloader xMagicRootPath]stringByAppendingString:@"/motions"] withExtraInfo:beautyBaseItem.extraConfig];
                [weakSelf configPropertyWithType:@"custom" withName:@"makeup.strength" withData:[NSString stringWithFormat:@"%.2f", [beautyBaseItem currentValue]] withExtraInfo:nil];
            }];
            break;
        }
        case TUIBeautyTypeKoubei:
        case TUIBeautyTypeCosmetic:
        case TUIBeautyTypeGesture:
        case TUIBeautyTypeGreen: {
            [self loadResourceWithItem:beautyBaseItem complete:^(BOOL isSuccess, NSString * _Nonnull msg) {
                if (!weakSelf || !isSuccess) {
                    return;
                }
                [weakSelf configPropertyWithType:@"motion" withName:[beautyBaseItem key] withData:[[TUIBeautyDownloader xMagicRootPath] stringByAppendingString:@"/motions"] withExtraInfo:beautyBaseItem.extraConfig];
            }];
            break;
        }
        default:
            break;
    }
}

- (void)sliderValueChange:(TUIBeautyBaseItem *)beautyBaseItem {
    [self configPropertyWith:beautyBaseItem];
}

- (void)cleanXMagic {
    if (_xMagicKit) {
        [_xMagicKit deinit];
        _xMagicKit = nil;
    }
    _beautyManager = nil;
}

#pragma mark - TUIBeautyService
- (void)setLicenseUrl:(NSString *)url key:(NSString *)key completion:(void (^)(NSInteger, NSString * _Nonnull))completion {
    if (key && [key isKindOfClass: [NSString class]]) {
        if (key.length != 0) {
            [TELicenseCheck setTELicense:url key:key completion:completion];
        }
    }
}

- (int)processVideoFrameWithTextureId:(int)textureId textureWidth:(int)textureWidth textureHeight:(int)textureHeight {
    if (textureWidth != _renderSize.width || textureHeight != _renderSize.height) {
        _renderSize = CGSizeMake(textureWidth, textureHeight);
        [self.xMagicKit setRenderSize:_renderSize];
    }
    YTProcessInput *input = [[YTProcessInput alloc] init];
    input.textureData = [[YTTextureData alloc] init];
    input.textureData.texture = textureId;
    input.textureData.textureWidth = textureWidth;
    input.textureData.textureHeight = textureHeight;
    input.dataType = kYTTextureData;
    YTProcessOutput *output = [self.xMagicKit process:input withOrigin:YtLightImageOriginTopLeft withOrientation:YtLightCameraRotation0];
    return output.textureData.texture;
}

#pragma mark - Private
- (void)configPropertyWithType:(NSString *)propertyType withName:(NSString *)propertyName withData:(NSString *)propertyValue withExtraInfo:(id)extraInfo {
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!weakSelf) {
            return;
        }
        [weakSelf.xMagicKit configPropertyWithType:propertyType withName:propertyName withData:propertyValue withExtraInfo:extraInfo];
    });
}

- (void)loadResourceWithItem:(TUIBeautyBaseItem *)item complete:(TUIBeautyLoadComplete)complete{
    if ([item.key isEqualToString:@"naught"]) {
        if (complete) {
            complete(YES, @"naught");
        }
        return;
    }
    [[TUIBeautyDownloader sharedInstance] loadResourceWithItem:item progress:^(float progress) {
        
    } complete:complete];
}

#pragma mark - YTSDKEventListener
/// @brief 提示事件回调
/// @param event dict格式的回调
- (void)onTipsEvent:(id _Nonnull)event {
    
}

/// @brief 资源包事件回调
/// @param event string格式的回调
- (void)onAssetEvent:(id _Nonnull)event {
    
}

/// @brief AI事件回调
/// @param event dict格式的回调
- (void)onAIEvent:(id _Nonnull)event {
    
}

/// @brief YTDataUpdate事件回调
/// @param event NSString*格式的回调
- (void)onYTDataEvent:(id _Nonnull)event {
    
}

#pragma mark - YTSDKLogListener
/// @brief 日志监听回调Block
/// @param loggerLevel 返回当前日志等级
/// @param logInfo 返回当前日志信息
- (void)onLog:(YtSDKLoggerLevel)loggerLevel withInfo:(NSString * _Nonnull)logInfo {
    
}

#pragma mark - Getter
- (XMagic *)xMagicKit {
    if (!_xMagicKit) {
        NSString *beautyConfigPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
        beautyConfigPath = [beautyConfigPath stringByAppendingPathComponent:@"beauty_config.json"];
        NSFileManager *localFileManager=[[NSFileManager alloc] init];
        BOOL isDir = YES;
        NSDictionary * beautyConfigJson = @{};
        if ([localFileManager fileExistsAtPath:beautyConfigPath isDirectory:&isDir] && !isDir) {
            NSString *beautyConfigJsonStr = [NSString stringWithContentsOfFile:beautyConfigPath encoding:NSUTF8StringEncoding error:nil];
            NSError *jsonError;
            NSData *objectData = [beautyConfigJsonStr dataUsingEncoding:NSUTF8StringEncoding];
            beautyConfigJson = [NSJSONSerialization JSONObjectWithData:objectData options:NSJSONReadingMutableContainers error:&jsonError];
        }
        
        NSDictionary *assetsDict = @{@"core_name": @"LightCore.bundle",
                                     @"root_path": ([NSBundle mainBundle].bundlePath ?: @""),
                                     @"plugin_3d": @"Light3DPlugin.bundle",
                                     @"plugin_hand": @"LightHandPlugin.bundle",
                                     @"plugin_segment": @"LightSegmentPlugin.bundle",
                                     @"beauty_config": beautyConfigJson};
        _xMagicKit = [[XMagic alloc] initWithRenderSize:_renderSize assetsDict:assetsDict];
        [_xMagicKit configPropertyWithType:@"beauty" withName:@"beauty.smooth" withData:@"0.0" withExtraInfo:nil];
    }
    return _xMagicKit;
}

@end
