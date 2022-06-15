//
//  TUIBeautyPresenter.m
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import "TUIBeautyPresenter.h"
#import "TUIBeautyService.h"

#import "TUIBeautyPanelActionProxy.h"
#import "TUIBeautyModel.h"
#import "BeautyLocalized.h"
#import "TUIFilter.h"
#import "TUIBeautyHeader.h"

@interface TUIBeautyPresenter ()

@property (nonatomic, strong) TUIBeautyPanelActionProxy *actionPerformer;

@end

@implementation TUIBeautyPresenter

#pragma mark - Init
- (instancetype)initWithBeautyManager:(TXBeautyManager *)beautyManager {
    if (self = [super init]) {
        self.actionPerformer = [TUIBeautyPanelActionProxy proxyWithBeautyManager:beautyManager];
        self.beautyService.beautyManager = beautyManager;
        self.beautyStyle = 2;
        self.beautyLevel = 6;
        self.whiteLevel = 0;
        self.ruddyLevel = 0;
        self.currentShowIndexPath = [NSIndexPath indexPathForItem:-1 inSection:0];
    }
    return self;
}

#pragma mark - Init
- (void)dealloc {
    [self reset];
}

#pragma mark - Public
- (void)applyDefaultSetting {
    [self reset];
}

- (void)cleanXMagic {
    [self.beautyService cleanXMagic];
}

- (void)reset {
    LOGD("【Beauty】reset to default");
    for (TUIBeautyBasePackage *pkg in self.dataSource) {
        for (TUIBeautyBaseItem *item in pkg.items) {
            item.currentValue = item.defaultValue;
            switch (item.type) {
                case TUIBeautyTypeBeauty: {
                    if (item.index <= 4) {
                        self.beautyStyle = item.index < 3 ? item.index : 2;
                        [item sendAction:@[@(item.currentValue), @(self.beautyStyle), @(self.beautyLevel), @(self.whiteLevel), @(self.ruddyLevel)]];
                    }
                    else {
                        [item sendAction:@[@(0)]];
                    }
                } break;
                case TUIBeautyTypeFilter: {
                    if (!item.isClear) {
                        TUIBeautyFilterItem *filterItem = (TUIBeautyFilterItem *)item;
                        if ([filterItem.identifier isEqualToString:@"baixi"]) {
                            [filterItem setFilter];
                            [filterItem setSlider:item.currentValue];
                        }
                    }
                } break;
                case TUIBeautyTypeMotion:
                case TUIBeautyTypeKoubei:
                case TUIBeautyTypeCosmetic:
                case TUIBeautyTypeGesture: {
                    if (item.isClear) {
                        [item sendAction:@[]];
                    }
                    else {
                        TUIBeautyMotionItem *motionItem = (TUIBeautyMotionItem *)item;
                        [motionItem stopTask];
                    }
                } break;
                case TUIBeautyTypeGreen: {
                    if (item.isClear) {
                        [item sendAction:@[]];
                    }
                } break;
                default:
                    break;
            }
        }
    }
}

#pragma mark - Private

#pragma mark - Green
- (TUIBeautyBasePackage *)getGreenPackage {
    TUIBeautyGreenPackage *pkg = [[TUIBeautyGreenPackage alloc] initWithType:TUIBeautyTypeGreen title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.GreenScreen") enableClearBtn:YES enableSlider:NO];
    NSString *path = [TUIBeautyBundle() pathForResource:@"goodluck" ofType:@"mp4"];
    if (path) {
        TUIBeautyGreenItem *item = [[TUIBeautyGreenItem alloc] initWithUrl:path title:TUIBeautyLocalize(@"TC.BeautySettingPanel.GoodLuck") normalIcon:@"beautyPanelGoodLuckIcon" package:pkg target:self.actionPerformer];
        [pkg.items addObject:item];
    }
    
    TUIBeautyBaseItem *clearItem = pkg.clearItem;
    if (clearItem != nil) {
        [clearItem addTarget:self.actionPerformer action:@selector(setGreenScreenFile:)];
        [pkg.items insertObject:clearItem atIndex:0];
    }
    
    return pkg;
}

#pragma mark - Motion
- (NSArray <TUIBeautyBasePackage *>*)getMotionPackages {
    NSMutableArray <TUIBeautyBasePackage *>*pkgs = [NSMutableArray array];
    NSDictionary *root = [self readMotionJson];
    NSDictionary *xmagic = [self readXMagicConfig];
    
    if ([root.allKeys containsObject:@"motion"]) {
        NSArray *arr = root[@"motion"];
        if ([arr isKindOfClass:[NSArray class]]) {
            TUIBeautyMotionPackage *pkg = [[TUIBeautyMotionPackage alloc] initWithType:TUIBeautyTypeMotion title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.VideoEffect") enableClearBtn:YES enableSlider:NO];
            [pkg decodeItems:arr target:self.actionPerformer];
            [pkg decodeItems:[xmagic objectForKey:@"motion2DMenu"]];
            [pkg decodeItems:[xmagic objectForKey:@"motion3DMenu"]];
            [pkg decodeItems:[xmagic objectForKey:@"motionHandMenu"]];
            [pkg decodeItems:[xmagic objectForKey:@"motionGanMenu"]];
            [pkgs addObject:pkg];
        }
    }
    
    if ([root.allKeys containsObject:@"cosmetic"]) {
        NSArray *arr = root[@"cosmetic"];
        if ([arr isKindOfClass:[NSArray class]]) {
            TUIBeautyMotionPackage *pkg = [[TUIBeautyMotionPackage alloc] initWithType:TUIBeautyTypeKoubei title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.Cosmetic") enableClearBtn:YES enableSlider:NO];
            [pkg decodeItems:arr target:self.actionPerformer];
            [pkg decodeItems:[xmagic objectForKey:@"makeup"]];
            [pkgs addObject:pkg];
        }
    }
    if ([root.allKeys containsObject:@"bgremove"]) {
        NSArray *arr = root[@"bgremove"];
        if ([arr isKindOfClass:[NSArray class]]) {
            TUIBeautyMotionPackage *pkg = [[TUIBeautyMotionPackage alloc] initWithType:TUIBeautyTypeGesture title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.BlendPic") enableClearBtn:YES enableSlider:NO];
            [pkg decodeItems:arr target:self.actionPerformer];
            [pkg decodeItems:[xmagic objectForKey:@"beautySeg"]];
            [pkgs addObject:pkg];
        }
    }
    return pkgs;
}

- (NSDictionary *)readMotionJson {
    NSString *path = [TUIBeautyBundle() pathForResource:@"TCPituMotion" ofType:@"json"];
    if (path == nil) {
        return @{};
    }
    
    NSData *data = [NSData dataWithContentsOfFile:path];
    if (!data) {
        return @{};
    }
    
    NSError *error;
    NSDictionary *root = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if (error) {
        return @{};
    }
    if (![root isKindOfClass:[NSDictionary class]]) {
        return @{};
    }
    if (![root.allKeys containsObject:@"bundle"] || ![root.allKeys containsObject:@"package"]) {
        return @{};
    }
    
    NSString *bundle = root[@"bundle"];
    if (![bundle isKindOfClass:[NSString class]]) {
        return @{};
    }
    if (![bundle isEqualToString:@"pitu"]) {
        return @{};
    }
    
    NSDictionary *packages = root[@"package"];
    if (![packages isKindOfClass:[NSDictionary class]]) {
        return @{};
    }
    
    return packages;
}

- (NSDictionary *)readXMagicConfig {
    NSString *path = [TUIBeautyBundle() pathForResource:@"TCXmagic" ofType:@"json"];
    if (path == nil) {
        return @{};
    }
    
    NSData *data = [NSData dataWithContentsOfFile:path];
    if (!data) {
        return @{};
    }
    
    NSError *error;
    NSDictionary *root = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if (error) {
        return @{};
    }
    if (![root isKindOfClass:[NSDictionary class]]) {
        return @{};
    }
    return [root objectForKey:@"beauty"];
}


#pragma mark - Filter
- (TUIBeautyBasePackage *)getFilterPackage {
    TUIBeautyFilterPackage *pkg = [[TUIBeautyFilterPackage alloc] initWithType:TUIBeautyTypeFilter title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.Filter") enableClearBtn:YES enableSlider:YES];
    NSArray *defaultValue = TUIBeautyFilterPackage.defaultFilterValue;
    NSArray *allFilters = [TUIFilterManager defaultManager].allFilters;
    
    for (int i = 0; i < allFilters.count; i++) {
        TUIFilter *filter = allFilters[i];
        NSString *identifier = [NSString stringWithFormat:@"TC.Common.Filter_%@", filter.identifier];
        NSString *imgName = filter.identifier;
        if ([imgName isEqualToString:@"white"]) {
            imgName = @"fwhite";
        }
        
        TUIBeautyFilterItem *item = [[TUIBeautyFilterItem alloc] initWithTitle:TUIBeautyLocalize(identifier) normalIcon:[UIImage imageNamed:imgName inBundle:TUIBeautyBundle() compatibleWithTraitCollection:nil] package:pkg lookupImagePath:filter.lookupImagePath target:self.actionPerformer currentValue:[defaultValue[i] floatValue] minValue:0 maxValue:9 identifier:filter.identifier];
        item.index = i;
        [pkg.items addObject:item];
    }
    NSArray *xMagicfilterItems = [TUIFilterManager defaultManager].xMagicfilterItems;
    for (TUIFilter *filter in xMagicfilterItems) {
        
        NSString *iconPath = [NSString stringWithFormat:@"%@/%@.png", [[NSBundle mainBundle] pathForResource:@"TUIBeautyKitBundle" ofType:@"bundle"] , filter.identifier];
        NSData *data = [NSData dataWithContentsOfFile:iconPath];
        UIImage *icon = [UIImage imageWithData:data];
        TUIBeautyFilterItem *item = [[TUIBeautyFilterItem alloc] initWithTitle:filter.title normalIcon:icon package:pkg lookupImagePath:filter.lookupImagePath target:self currentValue:[filter.strength floatValue] minValue:0 maxValue:100 identifier:filter.identifier];
        item.isXmagic = YES;
        item.path = filter.path;
        [pkg.items addObject:item];
    }
    TUIBeautyBaseItem *clearItem = pkg.clearItem;
    if (clearItem != nil) {
        [clearItem addTarget:self action:@selector(setFilter:)];
        [pkg.items insertObject:clearItem atIndex:0];
    }
    
    return pkg;
}

- (void)setFilter:(UIImage *)filterImage {
    [self.actionPerformer setFilter:filterImage];
    [self.actionPerformer setFilterStrength:0];
}

#pragma mark - Beauty
- (TUIBeautyBasePackage *)getBeautyPackage {
    TUIBeautyBeautyPackage *pkg = [[TUIBeautyBeautyPackage alloc] initWithType:TUIBeautyTypeBeauty title:TUIBeautyLocalize(@"TC.BeautyPanel.Menu.Beauty") enableClearBtn:NO enableSlider:YES];
    
    NSString *path = [TUIBeautyBundle() pathForResource:@"TCBeauty" ofType:@"json"];
    if (!path) {
        return pkg;
    }
    
    NSData *data = [NSData dataWithContentsOfFile:path];
    if (!data) {
        return pkg;
    }
    
    NSError *error;
    NSDictionary *root = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:&error];
    if (error || ![root isKindOfClass:[NSDictionary class]]) {
        return pkg;
    }
    
    if (![root.allKeys containsObject:@"package"]) {
        return pkg;
    }
    
    NSArray *arr = root[@"item"];
    if (![arr isKindOfClass:[NSArray class]]) {
        return pkg;
    }
    
    [pkg decodeItems:arr target:self.actionPerformer];
    
    if (pkg.items.count > 3) {
        pkg.items[2].isSelected = YES;
    }
    
    TUIBeautyBaseItem *clearItem = pkg.clearItem;
    if (clearItem != nil) {
        [pkg.items insertObject:clearItem atIndex:0];
    }
    
    return pkg;
}

#pragma mark - Getter
- (TUIBeautyService *)beautyService {
    return [TUIBeautyService sharedInstance];
}

- (NSMutableArray<TUIBeautyBasePackage *> *)dataSource {
    if (!_dataSource) {
        _dataSource = [NSMutableArray array];
        
        TUIBeautyBasePackage *beautyPkg = [self getBeautyPackage];
        [_dataSource addObject:beautyPkg];
        
        TUIBeautyBasePackage *filterPkg = [self getFilterPackage];
        [_dataSource addObject:filterPkg];
        
        NSArray <TUIBeautyBasePackage *>*motionPkgs = [self getMotionPackages];
        [_dataSource addObjectsFromArray:motionPkgs];
        
        self.currentShowIndexPath = [NSIndexPath indexPathForItem:2 inSection:0];
        
        if (_dataSource.count > 0) {
            TUIBeautyBasePackage *first = _dataSource.firstObject;
            self.currentSelectItem = first.items.count > 3 ? first.items[2] : first.items.firstObject;
        }
    }
    return _dataSource;
}

@end
