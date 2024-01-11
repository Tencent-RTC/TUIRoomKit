//
//  ReplayKitLocalized.m
//  TXLiteAVDemo
//
//  Created by adams on 2021/3/22.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import "ReplayKitLocalized.h"

#pragma mark - Base
NSString *replayKitLocalizeFromTable(NSString *key,
                                     NSString *table) {
    return [NSBundle.mainBundle localizedStringForKey:key
                                                value:@""
                                                table:table];
}

NSString *replayKitLocalizeFromTableAndCommon(NSString *key, NSString *common, NSString *table) {
    return replayKitLocalizeFromTable(key, table);
}

#pragma mark - Replace String
NSString *replayKitLocalizeReplaceXX(NSString *origin,
                                     NSString *xxx_replace) {
    return [origin stringByReplacingOccurrencesOfString:@"xxx"
                                             withString:xxx_replace];
}

NSString *replayKitLocalizeReplace(NSString *origin,
                                   NSString *xxx_replace,
                                   NSString *yyy_replace) {
    return [[origin stringByReplacingOccurrencesOfString:@"xxx"
                                              withString:xxx_replace]
            stringByReplacingOccurrencesOfString:@"yyy"
            withString:yyy_replace];
}

NSString *replayKitLocalizeReplaceThreeCharacter(NSString *origin,
                                                 NSString *xxx_replace,
                                                 NSString *yyy_replace,
                                                 NSString *zzz_replace) {
    return [[[origin stringByReplacingOccurrencesOfString:@"xxx"
                                               withString:xxx_replace]
             stringByReplacingOccurrencesOfString:@"yyy"
             withString:yyy_replace]
            stringByReplacingOccurrencesOfString:@"zzz"
            withString:zzz_replace];
}

NSString *replayKitLocalizeReplaceFourCharacter(NSString *origin,
                                                NSString *xxx_replace,
                                                NSString *yyy_replace,
                                                NSString *zzz_replace,
                                                NSString *mmm_replace) {
    return [[[[origin stringByReplacingOccurrencesOfString:@"xxx"
                                                withString:xxx_replace]
              stringByReplacingOccurrencesOfString:@"yyy"
              withString:yyy_replace]
             stringByReplacingOccurrencesOfString:@"zzz"
             withString:zzz_replace]
            stringByReplacingOccurrencesOfString:@"mmm"
            withString:mmm_replace];
}

NSString *replayKitLocalizeReplaceFiveCharacter(NSString *origin,
                                                NSString *xxx_replace,
                                                NSString *yyy_replace,
                                                NSString *zzz_replace,
                                                NSString *mmm_replace,
                                                NSString *nnn_replace) {
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

#pragma mark - ReplayKit
NSString *const ReplayKit_Localize_TableName = @"ReplayKitLocalized";
NSString *replayKitLocalize(NSString *key) {
    return replayKitLocalizeFromTable(key, ReplayKit_Localize_TableName);
}
