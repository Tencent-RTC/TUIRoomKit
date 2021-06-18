//
//  AppLocalized.h
//  TXLiteAVDemo
//
//  Created by gg on 2021/3/17.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


#pragma mark - Base
extern NSBundle *MeetingBundle(void);

extern NSString *LocalizeFromTable(NSString *key, NSString *table);
extern NSString *LocalizeFromTableAndCommon(NSString *key, NSString *common, NSString *table);

#pragma mark - Replace String
extern NSString *LocalizeReplaceXX(NSString *origin, NSString *xxx_replace);
extern NSString *LocalizeReplace(NSString *origin, NSString *xxx_replace, NSString *yyy_replace);
extern NSString *LocalizeReplaceThreeCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace);
extern NSString *LocalizeReplaceFourCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace, NSString *mmm_replace);
extern NSString *LocalizeReplaceFiveCharacter(NSString *origin, NSString *xxx_replace, NSString *yyy_replace, NSString *zzz_replace, NSString *mmm_replace, NSString *nnn_replace);

#pragma mark - Meeting
extern NSString *const Meeting_Localize_TableName;
extern NSString *MeetingLocalize(NSString *key);

NS_ASSUME_NONNULL_END
