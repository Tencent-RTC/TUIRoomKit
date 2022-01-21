//
//  TUIRoomLocalized.m
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/15.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "TUIRoomLocalized.h"

#pragma mark - Base
NSBundle *tuiRoomBundle(void) {
    static NSBundle *bundle = nil;
    static dispatch_once_t gOnceToken;
    dispatch_once(&gOnceToken, ^{
        //没使用Framework的情况下
        NSURL *associateBundleURL = [[NSBundle mainBundle] URLForResource:@"TUIRoomKitBundle"
                                                            withExtension:@"bundle"];
        //使用framework形式
        if (!associateBundleURL) {
            associateBundleURL = [[NSBundle mainBundle] URLForResource:@"Frameworks" withExtension:nil];
            associateBundleURL = [associateBundleURL URLByAppendingPathComponent:@"TUIRoom"];
            associateBundleURL = [associateBundleURL URLByAppendingPathExtension:@"framework"];
            NSBundle *associateBundle = [NSBundle bundleWithURL:associateBundleURL];
            associateBundleURL = [associateBundle URLForResource:@"TUIRoomKitBundle"
                                                   withExtension:@"bundle"];
        }
        bundle = [NSBundle bundleWithURL:associateBundleURL];
    });
    return bundle;
}

NSString *tuiRoomLocalizeFromTable(NSString *key,
                                   NSString *table) {
    return [tuiRoomBundle() localizedStringForKey:key
                                            value:@""
                                            table:table];
}

NSString *tuiRoomLocalizeFromTableAndCommon(NSString *key,
                                            NSString *common,
                                            NSString *table) {
    return tuiRoomLocalizeFromTable(key, table);
}

#pragma mark - Replace String
NSString *tuiRoomLocalizeReplaceXX(NSString *origin,
                                   NSString *xxx_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    return [origin stringByReplacingOccurrencesOfString:@"xxx"
                                             withString:xxx_replace];
}

NSString *tuiRoomLocalizeReplace(NSString *origin,
                                 NSString *xxx_replace,
                                 NSString *yyy_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    return [[origin stringByReplacingOccurrencesOfString:@"xxx"
                                              withString:xxx_replace]
            stringByReplacingOccurrencesOfString:@"yyy"
            withString:yyy_replace];
}

NSString *tuiRoomLocalizeReplaceThreeCharacter(NSString *origin,
                                               NSString *xxx_replace,
                                               NSString *yyy_replace,
                                               NSString *zzz_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    return [[[origin stringByReplacingOccurrencesOfString:@"xxx"
                                               withString:xxx_replace]
             stringByReplacingOccurrencesOfString:@"yyy"
             withString:yyy_replace]
            stringByReplacingOccurrencesOfString:@"zzz"
            withString:zzz_replace];
}

NSString *tuiRoomLocalizeReplaceFourCharacter(NSString *origin,
                                              NSString *xxx_replace,
                                              NSString *yyy_replace,
                                              NSString *zzz_replace,
                                              NSString *mmm_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    if (mmm_replace == nil) { mmm_replace = @"";}
    return [[[[origin stringByReplacingOccurrencesOfString:@"xxx"
                                                withString:xxx_replace]
              stringByReplacingOccurrencesOfString:@"yyy"
              withString:yyy_replace]
             stringByReplacingOccurrencesOfString:@"zzz"
             withString:zzz_replace]
            stringByReplacingOccurrencesOfString:@"mmm"
            withString:mmm_replace];
}

NSString *tuiRoomLocalizeReplaceFiveCharacter(NSString *origin,
                                              NSString *xxx_replace,
                                              NSString *yyy_replace,
                                              NSString *zzz_replace,
                                              NSString *mmm_replace,
                                              NSString *nnn_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    if (mmm_replace == nil) { mmm_replace = @"";}
    if (nnn_replace == nil) { nnn_replace = @"";}
    return [[[[[origin stringByReplacingOccurrencesOfString:@"xxx"
                                                 withString:xxx_replace]
               stringByReplacingOccurrencesOfString:@"yyy"
               withString:yyy_replace]
              stringByReplacingOccurrencesOfString:@"zzz"
              withString:zzz_replace]
             stringByReplacingOccurrencesOfString:@"mmm"
             withString:mmm_replace]
            stringByReplacingOccurrencesOfString:@"nnn"
            withString:nnn_replace];
}


#pragma mark - TUIRoom
NSString *const tuiRoomLocalize_TableName = @"TUIRoomLocalized";

NSString *tuiRoomLocalize(NSString *key) {
    return tuiRoomLocalizeFromTable(key, tuiRoomLocalize_TableName);
}
