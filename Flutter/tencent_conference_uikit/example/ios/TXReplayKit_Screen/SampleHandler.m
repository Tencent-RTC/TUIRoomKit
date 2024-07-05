//
//  SampleHandler.m
//  TXReplayKit_Screen
//
//  Created by WesleyLei on 2022/1/13.
//  Copyright © 2022 Tencent. All rights reserved.
//

#import "SampleHandler.h"
#import "ReplayKitLocalized.h"
@import TXLiteAVSDK_ReplayKitExt;
#define APPGROUP @"com.tencent.TUIRoomTXReplayKit-Screen"

@protocol TXReplayKitExtDelegate;
@interface SampleHandler()
@end

@implementation SampleHandler
- (void)broadcastStartedWithSetupInfo:(NSDictionary<NSString *,NSObject *> *)setupInfo {
    [[TXReplayKitExt sharedInstance] setupWithAppGroup:APPGROUP delegate:self];
}

- (void)broadcastPaused {
    // User has requested to pause the broadcast. Samples will stop being delivered.
}

- (void)broadcastResumed {
    // User has requested to resume the broadcast. Samples delivery will resume.
}

- (void)broadcastFinished {
    [[TXReplayKitExt sharedInstance] broadcastFinished];
    // User has requested to finish the broadcast.
}

#pragma mark - TXReplayKitExtDelegate
- (void)broadcastFinished:(TXReplayKitExt *)broadcast reason:(TXReplayKitExtReason)reason
{
    NSString *tip = @"";
    switch (reason) {
        case TXReplayKitExtReasonRequestedByMain:
            tip = replayKitLocalize(@"TUIRoom.ScreenAnchor.liveStop");
            break;
        case TXReplayKitExtReasonDisconnected:
            tip = replayKitLocalize(@"TUIRoom.ScreenAnchor.appReset");
            break;
        case TXReplayKitExtReasonVersionMismatch:
            tip = replayKitLocalize(@"TUIRoom.ScreenAnchor.sdkError");
            break;
    }

    if (reason == TXReplayKitExtReasonRequestedByMain) {
        [self finishBroadcastWithError:nil];
    }else {
        NSError *error = [NSError errorWithDomain:NSStringFromClass(self.class)
                                             code:0
                                         userInfo:@{
                                             NSLocalizedFailureReasonErrorKey:tip
                                         }];
        [self finishBroadcastWithError:error];
    }
   
}

- (void)processSampleBuffer:(CMSampleBufferRef)sampleBuffer withType:(RPSampleBufferType)sampleBufferType {
    [[TXReplayKitExt sharedInstance] sendSampleBuffer:sampleBuffer withType:sampleBufferType];
}
@end
