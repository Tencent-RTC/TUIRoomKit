import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/manager/rtc_engine_manager.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

class RoomEventHandler extends TUIRoomObserver {
  final int volumeCanHeardMinLimit = 10;
  final _store = RoomStore.to;

  RoomEventHandler() {
    super.onAllUserMicrophoneDisableChanged = (roomId, isDisable) {
      _store.roomInfo.isMicrophoneDisableForAllUser = isDisable;
      makeToast(
          msg: isDisable ? 'allMutePrompt'.roomTr : 'allUnMutePrompt'.roomTr);
      _store.updateItemTouchableState();
    };

    super.onAllUserCameraDisableChanged = (roomId, isDisable) {
      _store.roomInfo.isCameraDisableForAllUser = isDisable;
      makeToast(
          msg: isDisable
              ? 'disableAllVideoPrompt'.roomTr
              : 'enableAllVideoPrompt'.roomTr);
      _store.updateItemTouchableState();
    };

    super.onRemoteUserEnterRoom = (roomId, userInfo) {
      _store.addUser(userInfo, _store.userInfoList);
    };

    super.onRemoteUserLeaveRoom = (roomId, userInfo) {
      _store.removeUser(userInfo.userId, _store.userInfoList);
      if (_store.roomInfo.isSeatEnabled == true &&
          _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
        _store.deleteInviteSeatUser(userInfo.userId);
      }
    };

    super.onUserVideoStateChanged = (userId, streamType, hasVideo, reason) {
      _store.updateUserVideoState(userId, hasVideo, reason, _store.userInfoList,
          isScreenStream: streamType == TUIVideoStreamType.screenStream);
      if (_store.roomInfo.isSeatEnabled == true &&
          _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
        _store.updateUserVideoState(
            userId, hasVideo, reason, _store.seatedUserList,
            isScreenStream: streamType == TUIVideoStreamType.screenStream);
      }

      if (streamType == TUIVideoStreamType.screenStream) {
        var userModel = _store.getUserById(userId);
        if (userModel != null) {
          _store.screenShareUser = userModel;
          _store.isSharing.value = hasVideo;
        }
      }

      if (userId == _store.currentUser.userId.value &&
          streamType != TUIVideoStreamType.cameraStreamLow) {
        _store.updateSelfVideoState(hasVideo, reason,
            isScreenStream: streamType == TUIVideoStreamType.screenStream);
      }
    };

    super.onUserAudioStateChanged = (userId, hasAudio, reason) {
      _store.updateUserAudioState(
          userId, hasAudio, reason, _store.userInfoList);
      if (_store.roomInfo.isSeatEnabled == true &&
          _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
        _store.updateUserAudioState(
            userId, hasAudio, reason, _store.seatedUserList);
      }

      if (userId == _store.currentUser.userId.value) {
        _store.updateSelfAudioState(hasAudio, reason);
      }
    };

    super.onUserVoiceVolumeChanged = (volumeMap) {
      volumeMap.forEach((userId, volume) {
        bool isTalking = false;
        if (volume > volumeCanHeardMinLimit) {
          isTalking = true;
        }

        _store.updateUserTalkingState(
            userId, isTalking, _store.userInfoList, volume);
        if (_store.roomInfo.isSeatEnabled == true &&
            _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
          _store.updateUserTalkingState(
              userId, isTalking, _store.seatedUserList, volume);
        }
      });
    };

    super.onUserInfoChanged =
        (TUIUserInfo userInfo, List<TUIUserInfoModifyFlag> modifyFlagList) {
      if (!modifyFlagList.contains(TUIUserInfoModifyFlag.userRole)) {
        return;
      }
      if (userInfo.userRole == TUIRole.roomOwner) {
        _store.roomInfo.ownerId = userInfo.userId;
        _store.roomInfo.ownerName = userInfo.userName;
      }
      _store.updateUserRole(
          userInfo.userId, userInfo.userRole, _store.userInfoList);

      if (_store.roomInfo.isSeatEnabled == true &&
          _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
        _store.updateUserRole(
            userInfo.userId, userInfo.userRole, _store.seatedUserList);
      }

      if (userInfo.userId == _store.currentUser.userId.value) {
        _store.updateSelfRole(userInfo.userRole);
        switch (userInfo.userRole) {
          case TUIRole.roomOwner:
            if (RoomStore.to.currentUser.userRole.value ==
                TUIRole.generalUser) {
              RoomEngineManager().getSeatApplicationList();
            }
            makeToast(msg: 'haveBecomeOwner'.roomTr);
            break;
          case TUIRole.administrator:
            if (RoomStore.to.currentUser.userRole.value ==
                TUIRole.generalUser) {
              RoomEngineManager().getSeatApplicationList();
            }
            makeToast(msg: 'haveBecomeAdministrator'.roomTr);
            break;
          case TUIRole.generalUser:
            if (RoomStore.to.currentUser.userRole.value ==
                TUIRole.administrator) {
              makeToast(msg: 'revokedYourAdministrator'.roomTr);
            }
            RoomStore.to.inviteSeatList.clear();
            RoomStore.to.inviteSeatMap.clear();
            break;
          default:
            break;
        }
        RoomStore.to.currentUser.userRole.value = userInfo.userRole;
        RoomStore.to.updateItemTouchableState();
      }
    };

    super.onSendMessageForUserDisableChanged =
        (String roomId, String userId, bool isDisable) {
      _store.updateUserMessageState(userId, isDisable, _store.userInfoList);
    };

    super.onSeatListChanged = (seatList, seatedList, leftList) async {
      for (var element in seatedList) {
        var result = await RoomEngineManager()
            .getRoomEngine()
            .getUserInfo(element.userId);
        if (result.code == TUIError.success) {
          _store.addUser(result.data!, RoomStore.to.seatedUserList);
          _store.updateUserSeatedState(element.userId, true,
              fallbackUserInfo: result.data!);
        }
      }
      for (var element in leftList) {
        _store.updateUserSeatedState(element.userId, false);
        _store.removeUser(element.userId, RoomStore.to.seatedUserList);
      }
    };

    super.onRequestReceived = (request) {
      switch (request.requestAction) {
        case TUIRequestAction.requestToTakeSeat:
          if (_store.roomInfo.isSeatEnabled == true &&
              _store.roomInfo.seatMode == TUISeatMode.applyToTake) {
            var userModel = _store.getUserById(request.userId);
            if (_store.inviteSeatMap[request.userId] == null &&
                userModel != null) {
              _store.addInviteSeatUser(userModel, request);
            }
          }
          break;
        default:
          break;
      }
    };

    super.onRequestCancelled = (TUIRequest request, TUIUserInfo operateUser) {
      _store.deleteTakeSeatRequest(request.requestId);
    };

    super.onRequestProcessed = (TUIRequest request, TUIUserInfo operateUser) {
      _store.deleteTakeSeatRequest(request.requestId);
    };

    super.onKickedOffSeat = (int seatIndex, TUIUserInfo operateUser) {
      makeToast(msg: 'kickedOffSeat'.roomTr);
    };
    super.onRoomUserCountChanged = (String roomId, int userCount) {
      _store.roomUserCount.value = userCount;
    };
  }
}
