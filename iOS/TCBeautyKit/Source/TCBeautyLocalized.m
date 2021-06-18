//
//  TCBeautyLocalized.m
//  TXLiteAVDemo
//
//  Created by gg on 2021/3/17.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TCBeautyLocalized.h"

#pragma mark - Base
NSBundle *TCBeautyBundle(void) {
    NSURL *TCBeautyBundleURL = [[NSBundle mainBundle] URLForResource:@"TCBeautyKitBundle" withExtension:@"bundle"];
    NSBundle *TCBeautyBundle = [NSBundle bundleWithURL:TCBeautyBundleURL];
    return TCBeautyBundle;
}

NSString *TCLocalizeFromTable(NSString *key, NSString *table) {
    return [TCBeautyBundle() localizedStringForKey:key value:@"" table:table];
}
#pragma mark - TCBeauty

NSString *const TCBeauty_Localize_TableName = @"TCBeautyLocalized";
NSString *TCBeautyLocalize(NSString *key) {
    return TCLocalizeFromTable(key, TCBeauty_Localize_TableName);
}
