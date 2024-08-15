import 'package:tencent_cloud_chat_sdk/models/v2_tim_friend_info.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class UserInfo {
  String userId;
  String userName;
  String avatarUrl;

  UserInfo(this.userId, this.userName, this.avatarUrl);

  factory UserInfo.fromV2TimFriendInfo(V2TimFriendInfo friendInfo) {
    return UserInfo(
      friendInfo.userID,
      friendInfo.userProfile?.nickName ?? friendInfo.userID,
      friendInfo.userProfile?.faceUrl ?? Constants.defaultAvatarUrl,
    );
  }

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(json['userId'], json['userName'], json['avatarUrl']);
  }
}
