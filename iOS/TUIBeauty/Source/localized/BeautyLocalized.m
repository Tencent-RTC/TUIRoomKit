//
//  BeautyLocalized.m
//  Pods
//
//  Created by gg on 2021/9/22.
//

#import "BeautyLocalized.h"

#pragma mark - Base

NSBundle *TUIBeautyBundle(void) {
    NSURL *beautyKitBundleURL = [[NSBundle mainBundle] URLForResource:@"TUIBeautyKitBundle" withExtension:@"bundle"];
    return [NSBundle bundleWithURL:beautyKitBundleURL];
}

NSString *TUIBeautyLocalizeFromTable(NSString *key, NSString *table) {
    return [TUIBeautyBundle() localizedStringForKey:key value:@"" table:table];
}

NSString *TUIBeautyLocalizeFromTableAndCommon(NSString *key, NSString *common, NSString *table) {
    return TUIBeautyLocalizeFromTable(key, table);
}

#pragma mark - Replace String

NSString *TUIBeautyLocalizeReplaceXX(NSString *origin, NSString *xxx_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    return [origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace];
}

NSString *TUIBeautyLocalizeReplace(NSString *origin, NSString *xxx_replace, NSString *yyy_replace) {
    if (yyy_replace == nil) { yyy_replace = @"";}
    return [TUIBeautyLocalizeReplaceXX(origin, xxx_replace) stringByReplacingOccurrencesOfString:@"yyy" withString:yyy_replace];
}

#pragma mark - Beauty

NSString *const TUIBeauty_Localize_TableName = @"BeautyLocalized";
NSString *TUIBeautyLocalize(NSString *key) {
    return TUIBeautyLocalizeFromTable(key, TUIBeauty_Localize_TableName);
}
