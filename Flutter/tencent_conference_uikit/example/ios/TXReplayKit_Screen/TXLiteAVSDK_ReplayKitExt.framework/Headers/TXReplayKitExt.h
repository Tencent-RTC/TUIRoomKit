/*
 * Module:   TXReplayKitExt @ TXLiteAVSDK
 *
 * Function: The main interface class of Tencent Cloud ReplayKit screen recording function in Extension
 *
 * Version: <:Version:>
 */

/// @defgroup TXReplayKitExt_ios TXReplayKitExt
/// The main interface class of Tencent Cloud ReplayKit screen recording function in Extension
/// @{

#import <CoreMedia/CoreMedia.h>
#import <Foundation/Foundation.h>
#import <ReplayKit/ReplayKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSUInteger, TXReplayKitExtReason) {
  /// Main process request ends
  TXReplayKitExtReasonRequestedByMain,
  /// The link is broken and the main process exits
  TXReplayKitExtReasonDisconnected,
  /// The version does not match the main process SDK
  TXReplayKitExtReasonVersionMismatch
};

@protocol TXReplayKitExtDelegate;

/// Screen sharing main entrance class
API_AVAILABLE(ios(11.0))
__attribute__((visibility("default"))) @interface TXReplayKitExt : NSObject

/// Get singleton
+ (instancetype)sharedInstance;

/// Initialization method
///
/// Needs to be called in the broadcastStartedWithSetupInfo method in the implementation class of RPBroadcastSampleHandler
/// @param appGroup App group ID
/// @param delegate Callback object
- (void)setupWithAppGroup:(NSString *)appGroup delegate:(id<TXReplayKitExtDelegate>)delegate;

/// Method of screen recording paused
///
/// When stopping screen recording through the system control center, RPBroadcastSampleHandler.broadcastPaused 
/// will be called back, which is called in the broadcastPaused method.
- (void)broadcastPaused;

/// Method of screen recording resumed
///
/// When stopping screen recording through the system control center, RPBroadcastSampleHandler.broadcastPaused 
/// will be called back, which is called in the broadcastPaused method.
- (void)broadcastResumed;

/// Method of screen recording finished
///
/// When stopping screen recording through the system control center, RPBroadcastSampleHandler.broadcastPaused 
/// will be called back, which is called in the broadcastPaused method.
- (void)broadcastFinished;

/// Media data (audio and video) sending method
///
/// Need to be called in the processSampleBuffer: method in the implementation class of RPBroadcastSampleHandler
///
/// @param sampleBuffer Video or audio frame for system callback
/// @param sampleBufferType media input type
/// @note
/// - sampleBufferType currently supports data frame processing of RPSampleBufferTypeVideo and RPSampleBufferTypeAudioApp types.
/// - RPSampleBufferTypeAudioMic is not supported. Please process the microphone collection data in the main app.
- (void)sendSampleBuffer:(CMSampleBufferRef)sampleBuffer
                withType:(RPSampleBufferType)sampleBufferType;

/// Video sending method
/// Deprecated, please use - (void)sendSampleBuffer:(CMSampleBufferRef)sampleBuffer
/// withType:(RPSampleBufferType)sampleBufferType; instead，Need to be called in the 
/// processSampleBuffer: method in the implementation class of RPBroadcastSampleHandler.
///
/// @param sampleBuffer System callback video frame
- (void)sendVideoSampleBuffer:(CMSampleBufferRef)sampleBuffer
    __attribute__((deprecated("use sendSampleBuffer:withType instead")));

@end

API_AVAILABLE(ios(11.0))
@protocol TXReplayKitExtDelegate <NSObject>

/// Screen recording completion callback
///
/// @param broadcast The instance that issues the callback
/// @param reason End reason code, see TXReplayKitExtReason
- (void)broadcastFinished:(TXReplayKitExt *)broadcast reason:(TXReplayKitExtReason)reason;

@end

NS_ASSUME_NONNULL_END
/// @}
