//
//  BeautyLocalized.h
//  Pods
//
//  Created by gg on 2021/9/22.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

#pragma mark - Base

extern NSBundle *TUIBeautyBundle(void);

#pragma mark - Replace String

extern NSString *TUIBeautyLocalizeReplaceXX(NSString *origin, NSString *xxx_replace);
extern NSString *TUIBeautyLocalizeReplace(NSString *origin, NSString *xxx_replace, NSString *yyy_replace);

#pragma mark - Beauty

extern NSString *const TUIBeauty_Localize_TableName;
extern NSString *TUIBeautyLocalize(NSString *key);

NS_ASSUME_NONNULL_END
