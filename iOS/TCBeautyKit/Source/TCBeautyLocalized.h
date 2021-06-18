//
//  TCBeautyLocalized.h
//  TXLiteAVDemo
//
//  Created by gg on 2021/3/17.
//  Copyright © 2021 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN


#pragma mark - Base
extern NSBundle *TCBeautyBundle(void);
extern NSString *TCLocalizeFromTable(NSString *key, NSString *table);

#pragma mark - TCBeauty
extern NSString *const TCBeauty_Localize_TableName;
extern NSString *TCBeautyLocalize(NSString *key);

NS_ASSUME_NONNULL_END
