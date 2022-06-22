//
//  TUIBeautyView.m
//  TUIBeauty
//
//  Created by gg on 2021/9/22.
//

#import "TUIBeautyView.h"
#import "TUIBeautyPanelActionProxy.h"
#import "UIView+TUIUtil.h"
#import "Masonry.h"
#import "TUIBeautyIntensityView.h"
#import "TUIBeautyHeader.h"
#import "TUIBeautyBeautyTypeCell.h"
#import "TUIBeautyBeautyCell.h"
#import "TUIBeautyPresenter.h"
#import "NSString+TUIUtil.h"
#import "BeautyLocalized.h"

#import "TUIBeautyService.h"
@interface TUIBeautyView () <UICollectionViewDelegate, UICollectionViewDataSource>

@property (nonatomic, strong) UILabel *titleLabel;
@property (nonatomic, strong) UIView  *backgroundView;
@property (nonatomic, strong) UIView  *contentView;

@property (nonatomic, strong) TUIBeautyIntensityView *intensityView;

@property (nonatomic, strong) UICollectionView *beautyCollectionView;
@property (nonatomic, strong) UICollectionView *beautyTypeCollectionView;

@property (nonatomic, strong) TUIBeautyPresenter *presenter;

@end

@implementation TUIBeautyView {
    BOOL _isShow;
    BOOL _isViewReady;
}

#pragma mark - Interface
- (instancetype)initWithBeautyManager:(TXBeautyManager *)beautyManager {
    CGRect beautyFrame = UIScreen.mainScreen.bounds;
    if (self = [super initWithFrame:beautyFrame]) {
        self.presenter = [[TUIBeautyPresenter alloc] initWithBeautyManager:beautyManager];
        self.alpha = 0;
        self.contentView.transform = CGAffineTransformMakeTranslation(0, CGRectGetHeight(beautyFrame));
        
        _isShow = NO;
        _isViewReady = NO;
        
        self.backgroundView.alpha = 0;
        self.titleLabel.text = TUIBeautyLocalize(@"TC.BeautySettingPanel.Setup");
    }
    return self;
}

+ (id<TUIBeautyService>)getBeautyService {
    return [TUIBeautyService sharedInstance];
}

- (void)dealloc {
    [self.presenter applyDefaultSetting];
    [self.presenter cleanXMagic];
}

- (void)setTheme:(TUIThemeConfig *)theme {
    _theme = theme;
}

- (void)setHidden:(BOOL)hidden {
    if (hidden) {
        [self dismiss];
    }
    else {
        [self show];
    }
}

- (void)show {
#ifdef RTCube_APPSTORE
    SEL checkAuthSEL = NSSelectorFromString(@"checkBeautyAuthWithCompletion:");
    if (checkAuthSEL) {
        __weak typeof(self) weakSelf = self;
        id completion = ^(BOOL isAllow){
            if (!weakSelf) {
                return;
            }
            if (isAllow) {
                [weakSelf internalShow];
            }
        };
        [UIViewController performSelector:checkAuthSEL withObject:completion];
        return;
    }
#endif
    [self internalShow];
}

- (void)internalShow {
    _isShow = YES;
    LOGD("【Beauty】show");
    [UIView animateWithDuration:0.3 animations:^{
        self.alpha = 1;
        self.contentView.transform = CGAffineTransformIdentity;
    } completion:^(BOOL finished) {
        [self.beautyTypeCollectionView selectItemAtIndexPath:[NSIndexPath indexPathForItem:self.presenter.currentShowIndexPath.section inSection:0] animated:YES scrollPosition:UICollectionViewScrollPositionCenteredHorizontally];
        [self.beautyCollectionView selectItemAtIndexPath:[NSIndexPath indexPathForItem:self.presenter.currentShowIndexPath.item inSection:0] animated:YES scrollPosition:UICollectionViewScrollPositionCenteredHorizontally];
        if (self.presenter.currentSelectItem != nil) {
            TUIBeautyBaseItem *item = self.presenter.currentSelectItem;
            self.intensityView.hidden = !(!item.isClear && item.package.enableSlider);
            if (!self.intensityView.isHidden) {
                [self.intensityView setSliderMinValue:item.minValue maxValue:item.maxValue];
                [self.intensityView setSliderValue:item.currentValue];
            }
        }
    }];
}

- (void)dismiss {
    _isShow = NO;
    LOGD("【Beauty】dismiss");
    [UIView animateWithDuration:0.3 animations:^{
        self.alpha = 0;
        self.contentView.transform = CGAffineTransformMakeTranslation(0, self.frame.size.height);
    } completion:^(BOOL finished) {
        
    }];
}

#pragma mark - Private

- (void)didMoveToWindow {
    [super didMoveToWindow];
    
    if (_isViewReady) {
        return;
    }
    _isViewReady = YES;
    [self constructViewHierarchy];
    [self activateConstraints];
    [self bindInteraction];
    [self.presenter applyDefaultSetting];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    CGPoint point = [[touches anyObject] locationInView:self];
    if (!CGRectContainsPoint(self.contentView.frame, point)) {
        [self dismiss];
    }
}

- (void)drawRect:(CGRect)rect {
    [super drawRect:rect];
    if (!_isShow) {
        self.contentView.transform = CGAffineTransformMakeTranslation(0, self.frame.size.height);
    }
    [self.contentView roundedRect:UIRectCornerTopLeft | UIRectCornerTopRight withCornerRatio:12];
}

- (void)constructViewHierarchy {
    
    [self addSubview:self.backgroundView];
    [self addSubview:self.contentView];
    [self.contentView addSubview:self.titleLabel];
    [self.contentView addSubview:self.intensityView];
    [self.contentView addSubview:self.beautyCollectionView];
    [self.contentView addSubview:self.beautyTypeCollectionView];
}

- (void)activateConstraints {
    [self.backgroundView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.edges.equalTo(self);
    }];
    [self.contentView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.leading.trailing.bottom.equalTo(self);
    }];
    [self.titleLabel mas_makeConstraints:^(MASConstraintMaker *make) {
        make.leading.equalTo(self.contentView).offset(20);
        make.top.equalTo(self.contentView).offset(32);
    }];
    
    [self.intensityView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.titleLabel.mas_bottom).offset(20);
        make.leading.trailing.equalTo(self.contentView);
        make.height.mas_equalTo(52);
    }];
    [self.beautyCollectionView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.intensityView.mas_bottom).offset(10);
        make.leading.trailing.equalTo(self.contentView);
        make.height.mas_equalTo(75);
    }];
    [self.beautyTypeCollectionView mas_makeConstraints:^(MASConstraintMaker *make) {
        make.top.equalTo(self.beautyCollectionView.mas_bottom).offset(20);
        make.leading.trailing.equalTo(self.contentView);
        make.bottom.equalTo(self.contentView).offset(-20-kBeautyDeviceSafeBottomHeight);
        make.height.mas_equalTo(28);
    }];
}

- (void)bindInteraction {
    [self.beautyCollectionView registerClass:[TUIBeautyBeautyCell class] forCellWithReuseIdentifier:@"TUIBeautyBeautyCell"];
    [self.beautyTypeCollectionView registerClass:[TUIBeautyBeautyTypeCell class] forCellWithReuseIdentifier:@"TUIBeautyBeautyTypeCell"];
    @weakify(self)
    self.intensityView.onSliderValueChanged = ^(float value) {
        @strongify(self)
        TUIBeautyBaseItem *item = self.presenter.currentSelectItem;
        if (item.isXmagic) {
            item.currentValue = value;
            [self.presenter.beautyService sliderValueChange:item];
        } else {
            switch (item.type) {
                case TUIBeautyTypeBeauty:
                    [self setBeautySlider:value item:(TUIBeautyBeautyItem *)item];
                    break;
                case TUIBeautyTypeFilter:
                    [self setFilterSlider:value item:(TUIBeautyFilterItem *)item];
                default:
                    break;
            }
        }
    };
}

- (void)setFilterSlider:(float)value item:(TUIBeautyFilterItem *)item {
    [item setSlider:value];
}

- (void)setBeautySlider:(float)value item:(TUIBeautyBeautyItem *)item {
    if (item.index > 4) {
        [item sendAction:@[@(value)]];
    }
    else if (item.index < 3) {
        self.presenter.beautyStyle = item.index;
        self.presenter.beautyLevel = value;
        [item sendAction:@[@(value),
                           @(self.presenter.beautyStyle),
                           @(self.presenter.beautyLevel),
                           @(self.presenter.whiteLevel),
                           @(self.presenter.ruddyLevel)]];
    }
    else {
        self.presenter.beautyStyle = 2;
        if (item.index == 3) {
            self.presenter.whiteLevel = value;
        }
        else if (item.index == 4) {
            self.presenter.ruddyLevel = value;
        }
        [item sendAction:@[@(value),
                           @(self.presenter.beautyStyle),
                           @(self.presenter.beautyLevel),
                           @(self.presenter.whiteLevel),
                           @(self.presenter.ruddyLevel)]];
    }
}

#pragma mark - UICollectionViewDelegate, UICollectionViewDataSource
- (NSInteger)collectionView:(UICollectionView *)collectionView numberOfItemsInSection:(NSInteger)section {
    if (collectionView == self.beautyCollectionView) {
        return self.presenter.dataSource[self.presenter.currentShowIndexPath.section].items.count;
    }
    else {
        return self.presenter.dataSource.count;
    }
}

- (__kindof UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath {
    if (collectionView == self.beautyCollectionView) {
        TUIBeautyBeautyCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"TUIBeautyBeautyCell" forIndexPath:indexPath];
        TUIBeautyBaseItem *item = self.presenter.dataSource[self.presenter.currentShowIndexPath.section].items[indexPath.item];
        cell.model = item;
        
        if (item == self.presenter.currentSelectItem) {
            self.intensityView.hidden = !(!item.isClear && item.package.enableSlider);
            if (!self.intensityView.isHidden) {
                [self.intensityView setSliderMinValue:item.minValue maxValue:item.maxValue];
                [self.intensityView setSliderValue:item.currentValue];
            }
        }
        
        return cell;
    }
    else {
        TUIBeautyBeautyTypeCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:@"TUIBeautyBeautyTypeCell" forIndexPath:indexPath];
        TUIBeautyBasePackage *pkg = self.presenter.dataSource[indexPath.item];
        cell.titleLabel.text = pkg.title;
        return cell;
    }
}

- (CGSize)collectionView:(UICollectionView *)collectionView layout:(UICollectionViewLayout*)collectionViewLayout sizeForItemAtIndexPath:(NSIndexPath *)indexPath {
    if (collectionView == self.beautyCollectionView) {
        return CGSizeMake(52, 75);
    }
    else {
        TUIBeautyBasePackage *pkg = self.presenter.dataSource[indexPath.item];
        CGFloat width = [pkg.title widthFromFont:TUIBeautyBeautyTypeCell.titleLabelFont];
        if (width < 32) {
            width = 32;
        }
        else if (width > 120) {
            width = 120;
        }
        return CGSizeMake(width, 28);
    }
}

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath {
    if (collectionView == self.beautyCollectionView) {
        if (self.presenter.currentSelectItem != nil) {
            self.presenter.currentSelectItem.isSelected = NO;
        }
        
        self.presenter.currentShowIndexPath = [NSIndexPath indexPathForItem:indexPath.item inSection:self.presenter.currentShowIndexPath.section];
        
        TUIBeautyBaseItem *item = self.presenter.dataSource[self.presenter.currentShowIndexPath.section].items[self.presenter.currentShowIndexPath.item];
        self.presenter.currentSelectItem = item;
        
        LOGD("【Beauty】select item: %@[%d]", item.package.typeStr, item.index);
        
        item.isSelected = YES;
        switch (item.type) {
            case TUIBeautyTypeBeauty: {
                self.intensityView.hidden = NO;
                [self.intensityView setSliderMinValue:item.minValue maxValue:item.maxValue];
                [self.intensityView setSliderValue:item.currentValue];
                if (item.isXmagic) {
                    [self.presenter.beautyService configPropertyWith:item];
                } else {
                    if (item.index > 4) {
                        [item sendAction:@[@(item.currentValue)]];
                    }
                    else {
                        self.presenter.beautyStyle = item.index < 3 ? item.index : 2;
                        [item sendAction:@[@(item.currentValue),
                                         @(self.presenter.beautyStyle),
                                         @(self.presenter.beautyLevel),
                                         @(self.presenter.whiteLevel),
                                         @(self.presenter.ruddyLevel)]];
                    }
                    
                }
            } break;
            case TUIBeautyTypeFilter: {
                if (item.isClear) {
                    self.intensityView.hidden = YES;
                    if (item.isXmagic) {
                        [self.presenter.beautyService configPropertyWith:item];
                    }else {
                        [item sendAction:@[]];
                    }
                    return;
                }
                else {
                    TUIBeautyFilterItem *filterItem = (TUIBeautyFilterItem *)item;
                    if (item.isXmagic) {
                        [self.presenter.beautyService configPropertyWith:item];
                    } else {
                        [filterItem setFilter];
                    }
                    [filterItem setSlider:filterItem.currentValue];
                    self.intensityView.hidden = NO;
                    [self.intensityView setSliderMinValue:filterItem.minValue maxValue:filterItem.maxValue];
                    [self.intensityView setSliderValue:filterItem.currentValue];
                }
            } break;
            case TUIBeautyTypeMotion:
            case TUIBeautyTypeKoubei:
            case TUIBeautyTypeCosmetic:
            case TUIBeautyTypeGesture:
            case TUIBeautyTypeGreen: {
                self.intensityView.hidden = YES;
                if (item.isXmagic) {
                    [self.presenter.beautyService configPropertyWith:item];
                } else {
                    [item sendAction:@[]];
                }
            } break;
            default:
            {
                NSLog(@"【Beauty】click item: %@[%d]", item.package.typeStr, item.index);
            }
                break;
        }
    }
    else {
        self.presenter.currentShowIndexPath = [NSIndexPath indexPathForItem:0 inSection:indexPath.item];
        [self.beautyCollectionView reloadData];
        [self.beautyCollectionView layoutIfNeeded];
        [self.beautyCollectionView scrollToItemAtIndexPath:[NSIndexPath indexPathForItem:0 inSection:0] atScrollPosition:UICollectionViewScrollPositionCenteredHorizontally animated:NO];
        
        TUIBeautyBasePackage *pkg = self.presenter.dataSource[indexPath.item];
        if (pkg.type == TUIBeautyTypeFilter || pkg.type == TUIBeautyTypeBeauty) {
            self.intensityView.hidden = NO;
        } else {
            self.intensityView.hidden = YES;
        }
        if (self.presenter.currentSelectItem != nil && self.presenter.currentSelectItem.package == pkg) {
            self.intensityView.hidden = !pkg.enableSlider;
            if (!self.intensityView.isHidden && pkg.items.count > 0) {
                TUIBeautyBaseItem *item = pkg.items.firstObject;
                [self.intensityView setSliderMinValue:item.minValue maxValue:item.maxValue];
                [self.intensityView setSliderValue:item.currentValue];
            }
            NSUInteger index = [pkg.items indexOfObject:self.presenter.currentSelectItem];
            if (index == NSNotFound) {
                index = 0;
            }
            [self.beautyCollectionView selectItemAtIndexPath:[NSIndexPath indexPathForItem:index inSection:0] animated:YES scrollPosition:UICollectionViewScrollPositionLeft];
        }
    }
}

#pragma mark - Initialize
- (TUIBeautyIntensityView *)intensityView {
    if (!_intensityView) {
        _intensityView = [[TUIBeautyIntensityView alloc] initWithFrame:CGRectZero];
    }
    return _intensityView;
}

- (UICollectionView *)beautyCollectionView {
    if (!_beautyCollectionView) {
        UICollectionViewFlowLayout *layout = [[UICollectionViewFlowLayout alloc] init];
        layout.itemSize = CGSizeMake(52, 75);
        layout.minimumLineSpacing = 10;
        layout.minimumInteritemSpacing = 10;
        layout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
        _beautyCollectionView = [[UICollectionView alloc] initWithFrame:CGRectZero collectionViewLayout:layout];
        _beautyCollectionView.backgroundColor = [UIColor clearColor];
        _beautyCollectionView.contentInset = UIEdgeInsetsMake(0, 20, 0, 20);
        _beautyCollectionView.showsHorizontalScrollIndicator = NO;
        _beautyCollectionView.showsVerticalScrollIndicator = NO;
        _beautyCollectionView.delegate = self;
        _beautyCollectionView.dataSource = self;
    }
    return _beautyCollectionView;
}

- (UICollectionView *)beautyTypeCollectionView {
    if (!_beautyTypeCollectionView) {
        UICollectionViewFlowLayout *layout = [[UICollectionViewFlowLayout alloc] init];
        layout.itemSize = CGSizeMake(32, 28);
        layout.minimumLineSpacing = 20;
        layout.minimumInteritemSpacing = 20;
        layout.scrollDirection = UICollectionViewScrollDirectionHorizontal;
        _beautyTypeCollectionView = [[UICollectionView alloc] initWithFrame:CGRectZero collectionViewLayout:layout];
        _beautyTypeCollectionView.backgroundColor = [UIColor clearColor];
        _beautyTypeCollectionView.contentInset = UIEdgeInsetsMake(0, 20, 0, 20);
        _beautyTypeCollectionView.showsHorizontalScrollIndicator = NO;
        _beautyTypeCollectionView.showsVerticalScrollIndicator = NO;
        _beautyTypeCollectionView.delegate = self;
        _beautyTypeCollectionView.dataSource = self;
    }
    return _beautyTypeCollectionView;
}

- (UIView *)backgroundView {
    if (!_backgroundView) {
        _backgroundView = [[UIView alloc] initWithFrame:CGRectZero];
        _backgroundView.backgroundColor = [UIColor blackColor];
        _backgroundView.alpha = 0.6;
    }
    return _backgroundView;
}
- (UIView *)contentView {
    if (!_contentView) {
        _contentView = [[UIView alloc] initWithFrame:CGRectZero];
        _contentView.backgroundColor = [UIColor whiteColor];
    }
    return _contentView;
}
- (UILabel *)titleLabel {
    if (!_titleLabel) {
        _titleLabel = [[UILabel alloc] initWithFrame:CGRectZero];
        _titleLabel.textColor = [UIColor blackColor];
        _titleLabel.font = [UIFont fontWithName:@"PingFangSC-Medium" size:24];
    }
    return _titleLabel;
}

@end
