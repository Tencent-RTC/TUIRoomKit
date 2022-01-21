//
//  TUIRoomLocalized.h
//  TUIRoom
//
//  Created by WesleyLei on 2021/12/15.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


#pragma mark - Base
extern NSBundle *tuiRoomBundle(void);

extern NSString *tuiRoomLocalizeFromTable(NSString *key, NSString *table);
extern NSString *tuiRoomLocalizeFromTableAndCommon(NSString *key,
                                                   NSString *common,
                                                   NSString *table);

#pragma mark - Replace String
extern NSString *tuiRoomLocalizeReplaceXX(NSString *origin,
                                          NSString *xxx_replace);
extern NSString *tuiRoomLocalizeReplace(NSString *origin,
                                        NSString *xxx_replace,
                                        NSString *yyy_replace);
extern NSString *tuiRoomLocalizeReplaceThreeCharacter(NSString *origin,
                                                      NSString *xxx_replace,
                                                      NSString *yyy_replace,
                                                      NSString *zzz_replace);
extern NSString *tuiRoomLocalizeReplaceFourCharacter(NSString *origin,
                                                     NSString *xxx_replace,
                                                     NSString *yyy_replace,
                                                     NSString *zzz_replace,
                                                     NSString *mmm_replace);
extern NSString *tuiRoomLocalizeReplaceFiveCharacter(NSString *origin,
                                                     NSString *xxx_replace,
                                                     NSString *yyy_replace,
                                                     NSString *zzz_replace,
                                                     NSString *mmm_replace,
                                                     NSString *nnn_replace);

#pragma mark - TUIRoom
extern NSString *const TUIRoom_tuiRoomLocalize_TableName;
extern NSString *tuiRoomLocalize(NSString *key);

NS_ASSUME_NONNULL_END
