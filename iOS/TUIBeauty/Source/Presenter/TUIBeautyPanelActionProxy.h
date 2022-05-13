//
//  TUIBeautyPanelActionProxy.h
//  TUIBeautyPanel
//
//  Created by cui on 2019/12/23.
//  Copyright © 2019 Tencent. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TUIBeautyPanelActionPerformer.h"

NS_ASSUME_NONNULL_BEGIN

@interface TUIBeautyPanelActionProxy : NSProxy <TUIBeautyPanelActionPerformer>
@property (weak, nonatomic) id beautyManager;
+ (instancetype)proxyWithBeautyManager:(id)beautyManager;
@end

NS_ASSUME_NONNULL_END
