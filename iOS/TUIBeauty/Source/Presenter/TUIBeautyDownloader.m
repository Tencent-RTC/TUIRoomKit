//
//  TUIBeautyDownloader.m
//  TUIBeauty
//
//  Created by jack on 2022/5/4.
//

#import "TUIBeautyDownloader.h"
#import "TUIBeautyModel.h"
#import "SSZipArchive.h"
#import "UIView+TUIToast.h"
#import "BeautyLocalized.h"
@interface TUIBeautyDownloader ()<NSURLSessionDelegate>

@property (nonatomic, strong) NSURLSession *session;

@property (nonatomic, strong) NSDictionary *resourceInfo;

@property (nonatomic, strong) TUIBeautyBaseItem *currentItem;
@property (nonatomic, copy) TUIBeautyLoadProgress progressBlock;
@property (nonatomic, copy) TUIBeautyLoadComplete completeBlock;

@end

@implementation TUIBeautyDownloader

#pragma mark - init
+ (instancetype)sharedInstance {
    static dispatch_once_t once;
    static id sharedInstance;
    dispatch_once(&once, ^{
        sharedInstance = [[TUIBeautyDownloader alloc] init];
    });
    return sharedInstance;
}

- (instancetype)init {
    if (self = [super init]) {
        [self loadResourceJson];
    }
    return self;
}

#pragma mark - Public
+ (NSString *)xMagicRootPath {
    NSString *path = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
    NSFileManager *manager = [NSFileManager defaultManager];
    path = [path stringByAppendingPathComponent:@"Xmagic"];
    BOOL isDirectory = YES;
    if (![manager fileExistsAtPath:path isDirectory:&isDirectory]) {
        NSError *error = nil;
        [manager createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error];
        if (error) {
            NSLog(@"xMagicRootPath create error: %@", error.localizedDescription);
        }
    }
    return path;
}

- (void)loadResourceWithItem:(TUIBeautyBaseItem *)item progress:(TUIBeautyLoadProgress)progress complete:(TUIBeautyLoadComplete)complete {
    
    NSString *itemType = [self resourceTypeWithItem:item];
    NSString *itemName = item.key;
    
    NSString *downloadPath;
    if (itemType.length > 0 && itemName.length > 0) {
        downloadPath = [NSString stringWithFormat:@"%@/%@/%@", [TUIBeautyDownloader xMagicRootPath], itemType, itemName];
        if ([[NSFileManager defaultManager] fileExistsAtPath:downloadPath]) {
            __weak typeof(self) weakSelf = self;
            dispatch_async(dispatch_get_main_queue(), ^{
                if (!weakSelf) {
                    return;
                }
                [[weakSelf topViewController].view hideToast];
                if (complete) {
                    complete(YES, @"");
                }
            });
            return;
        }
    } else {
        downloadPath = [TUIBeautyDownloader xMagicRootPath];
        if ([[NSFileManager defaultManager] fileExistsAtPath:[downloadPath stringByAppendingString:@"/LightCore"] ]) {
            __weak typeof(self) weakSelf = self;
            dispatch_async(dispatch_get_main_queue(), ^{
                if (!weakSelf) {
                    return;
                }
                [[weakSelf topViewController].view hideToast];
                if (complete) {
                    complete(YES, @"");
                }
            });
            return;
        }
    }
    if (self.currentItem) {
        NSLog(@"Loading...");
        if (complete) {
            complete(NO, @"loading...");
        }
        return;
    }
    NSString *url = nil;
    if (_resourceInfo) {
        NSDictionary *bundleInfo = _resourceInfo[item.bundel];
        if (bundleInfo && [bundleInfo isKindOfClass:[NSDictionary class]]) {
            url = bundleInfo[item.key];
        }
    }
    if (url && [url isKindOfClass:[NSString class]] && url.length > 0) {
        self.currentItem = item;
        self.progressBlock = progress;
        self.completeBlock = complete;
        [self downloadResourceWithURL:url];
    } else {
        if (complete) {
            complete(NO, @"resource not found");
        }
    }
}

#pragma mark - Load Resource
- (void)downloadResourceWithURL:(NSString *)urlString {
    NSURL *url = [NSURL URLWithString:urlString];
    if (url == nil) {
        if (self.completeBlock) {
            self.completeBlock(NO, @"Url error");
        }
        return;
    }
    if (self.progressBlock) {
        self.progressBlock(0);
    }
    [[self topViewController].view makeToast:@"Downloading..." duration:100];
    NSURLRequest *request = [NSURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringLocalCacheData timeoutInterval:30];
    NSURLSessionDownloadTask *task = [self.session downloadTaskWithRequest:request];
    [task resume];
}

#pragma mark - Private
- (void)clearData {
    self.completeBlock = nil;
    self.progressBlock = nil;
    self.currentItem = nil;
}

- (void)loadResourceJson {
    _resourceInfo = [[NSDictionary alloc] init];
    NSString *jsonPath = [TUIBeautyBundle() pathForResource:@"xmagic" ofType:@"json"];
    if ([[NSFileManager defaultManager] fileExistsAtPath:jsonPath]) {
        NSData *jsonData = [[NSData alloc] initWithContentsOfFile:jsonPath];
        if (jsonData) {
            _resourceInfo = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingMutableLeaves error:nil];
        }
    }
}

- (UIViewController *)topViewController {
    UIViewController *resultVC;
    resultVC = [self _topViewController:[[UIApplication sharedApplication].windows.firstObject rootViewController]];
    while (resultVC.presentedViewController) {
        resultVC = [self _topViewController:resultVC.presentedViewController];
    }
    return resultVC;
}

- (UIViewController *)_topViewController:(UIViewController *)vc {
    if ([vc isKindOfClass:[UINavigationController class]]) {
        return [self _topViewController:[(UINavigationController *)vc topViewController]];
    } else if ([vc isKindOfClass:[UITabBarController class]]) {
        return [self _topViewController:[(UITabBarController *)vc selectedViewController]];
    } else {
        return vc;
    }
}

#pragma mark - NSURLSessionDelegate
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite {
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
        if (weakSelf.progressBlock == nil) {
            return;
        }
        float prog = totalBytesWritten * 1.0 / totalBytesExpectedToWrite;
        weakSelf.progressBlock(prog);
    });
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location {
    NSString *path = [TUIBeautyDownloader xMagicRootPath];
    if (self.itemType.length > 0) {
        path = [path stringByAppendingPathComponent:self.itemType];
    }
    BOOL res = [SSZipArchive unzipFileAtPath:location.path toDestination:path];
    __weak typeof(self) weakSelf = self;
    dispatch_async(dispatch_get_main_queue(), ^{
        if (!weakSelf) {
            return;
        }
        [[weakSelf topViewController].view hideToast];
        if (res) {
            if (weakSelf.completeBlock != nil) {
                weakSelf.completeBlock(YES, @"");
            }
        } else {
            if (weakSelf.completeBlock != nil) {
                weakSelf.completeBlock(NO, @"Unzip failed");
            }
        }
        [weakSelf clearData];
    });
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(nullable NSError *)error {
    __weak typeof(self) weakSelf = self;
    if (error.code == 0) {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (!weakSelf) {
                return;
            }
            [[weakSelf topViewController].view hideToast];
        });
    } else {
        dispatch_async(dispatch_get_main_queue(), ^{
            if (!weakSelf) {
                return;
            }
            [[weakSelf topViewController].view makeToast:[NSString stringWithFormat:@"Download Error: %ld",(long)error.code] duration:3];
        });
    }
    
    if (error != nil) {
        if (error.code == -999) {
            return;
        }
        if (self.completeBlock != nil) {
            self.completeBlock(NO, error.localizedDescription);
        }
        [self clearData];
    }
}

#pragma mark - Getter
- (NSURLSession *)session {
    if (!_session) {
        NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
        _session = [NSURLSession sessionWithConfiguration:config delegate:self delegateQueue:[NSOperationQueue mainQueue]];
    }
    return _session;
}

- (NSString *)itemType {
    return [self resourceTypeWithItem:_currentItem];
}

- (NSString *)resourceTypeWithItem:(TUIBeautyBaseItem *)item {
    return @"motions";
}

- (NSString *)itemName {
    if (_currentItem) {
        return [_currentItem key];
    }
    return @"";
}
@end
