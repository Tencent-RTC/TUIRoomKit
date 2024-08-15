//
//  ReplayKitLocalized.h
//  TXLiteAVDemo
//
//  Created by adams on 2021/3/22.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
#pragma mark - Base

extern NSString *replayKitLocalizeFromTable(NSString *key,
                                            NSString *table);
extern NSString *replayKitLocalizeFromTableAndCommon(NSString *key,
                                                     NSString *common,
                                                     NSString *table);

#pragma mark - Replace String
extern NSString *replayKitLocalizeReplaceXX(NSString *origin,
                                            NSString *xxx_replace);
extern NSString *replayKitLocalizeReplace(NSString *origin,
                                          NSString *xxx_replace,
                                          NSString *yyy_replace);
extern NSString *replayKitLocalizeReplaceThreeCharacter(NSString *origin,
                                                        NSString *xxx_replace,
                                                        NSString *yyy_replace,
                                                        NSString *zzz_replace);
extern NSString *replayKitLocalizeReplaceFourCharacter(NSString *origin,
                                                       NSString *xxx_replace,
                                                       NSString *yyy_replace,
                                                       NSString *zzz_replace,
                                                       NSString *mmm_replace);
extern NSString *replayKitLocalizeReplaceFiveCharacter(NSString *origin,
                                                       NSString *xxx_replace,
                                                       NSString *yyy_replace,
                                                       NSString *zzz_replace,
                                                       NSString *mmm_replace,
                                                       NSString *nnn_replace);

#pragma mark - ReplayKit
extern NSString *const ReplayKit_Localize_TableName;
extern NSString *replayKitLocalize(NSString *key);


NS_ASSUME_NONNULL_END
