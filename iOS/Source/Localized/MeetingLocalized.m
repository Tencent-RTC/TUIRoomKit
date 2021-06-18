//
//  MeetingLocalized.m
//  TXLiteAVDemo
//
//  Created by gg on 2021/3/17.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "MeetingLocalized.h"

#pragma mark - Base
NSBundle *MeetingBundle(void) {
    NSURL *meetingKitBundleURL = [[NSBundle mainBundle] URLForResource:@"TUIMeetingKitBundle" withExtension:@"bundle"];
    NSBundle *meetingBundle = [NSBundle bundleWithURL:meetingKitBundleURL];
    return meetingBundle;
}

NSString *LocalizeFromTable(NSString *key, NSString *table) {
    return [MeetingBundle() localizedStringForKey:key value:@"" table:table];
}

NSString *LocalizeFromTableAndCommon(NSString *key, NSString *common, NSString *table) {
    return LocalizeFromTable(key, table);
}

#pragma mark - Replace String
NSString *LocalizeReplaceXX(NSString *origin, NSString *xxx_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    return [origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace];
}

NSString *LocalizeReplace(NSString *origin, NSString *xxx_replace, NSString *yyy_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    return [[origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace] stringByReplacingOccurrencesOfString:@"yyy" withString:yyy_replace];
}

NSString *LocalizeReplaceThreeCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    return [[[origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace] stringByReplacingOccurrencesOfString:@"yyy" withString:yyy_replace]
        stringByReplacingOccurrencesOfString:@"zzz" withString:zzz_replace];
}

NSString *LocalizeReplaceFourCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace, NSString *mmm_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    if (mmm_replace == nil) { mmm_replace = @"";}
    return [[[[origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace] stringByReplacingOccurrencesOfString:@"yyy" withString:yyy_replace]
        stringByReplacingOccurrencesOfString:@"zzz" withString:zzz_replace]
            stringByReplacingOccurrencesOfString:@"mmm" withString:mmm_replace];
}

NSString *LocalizeReplaceFiveCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace, NSString *mmm_replace, NSString *nnn_replace) {
    if (xxx_replace == nil) { xxx_replace = @"";}
    if (yyy_replace == nil) { yyy_replace = @"";}
    if (zzz_replace == nil) { zzz_replace = @"";}
    if (mmm_replace == nil) { mmm_replace = @"";}
    if (nnn_replace == nil) { nnn_replace = @"";}
    return [[[[[origin stringByReplacingOccurrencesOfString:@"xxx" withString:xxx_replace] stringByReplacingOccurrencesOfString:@"yyy" withString:yyy_replace]
        stringByReplacingOccurrencesOfString:@"zzz" withString:zzz_replace]
            stringByReplacingOccurrencesOfString:@"mmm" withString:mmm_replace]
            stringByReplacingOccurrencesOfString:@"nnn" withString:nnn_replace];
}


#pragma mark - Meeting
NSString *const Meeting_Localize_TableName = @"MeetingLocalized";

NSString *MeetingLocalize(NSString *key) {
    return LocalizeFromTable(key, Meeting_Localize_TableName);
}
