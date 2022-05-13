//
//  TUIBeautyDownloader.h
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN

typedef void(^TUIBeautyLoadProgress)(float progress);
typedef void(^TUIBeautyLoadComplete)(BOOL isSuccess, NSString *msg);

@class TUIBeautyBaseItem;
@interface TUIBeautyDownloader : NSObject

+ (instancetype)sharedInstance;

/// Get Sandbox XMagic Resource Directory
///
/// @return Sandbox XMagic Resource Directory
+ (NSString *)xMagicRootPath;

/// Load Beauty Resource
/// @note If the resource does not exist, it will be downloaded.
///
/// @param item Beauty Resource Item
/// @param progress load progress
/// @param complete load complete
- (void)loadResourceWithItem:(TUIBeautyBaseItem *)item
                        progress:(TUIBeautyLoadProgress)progress
                        complete:(TUIBeautyLoadComplete)complete;

@end

NS_ASSUME_NONNULL_END
