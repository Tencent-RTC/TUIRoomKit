import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_engine/api/room/tui_room_observer.dart';
import 'package:rtc_room_tuikit/common/components/chat/widgets/message_color.dart';

class ChatController extends GetxController {
  var inputText = ''.obs;
  var isBarrageSliderOn = false.obs;
  RxList<RxList<MessageColor>> messageLogList = <RxList<MessageColor>>[].obs;
  TUIRoomEngine _roomEngine = TUIRoomEngine.createInstance();
  var isShowComment = false.obs;
  final inputFocusNode = FocusNode();

  addMessageLog(List<MessageColor> logInfos) {
    messageLogList.add(RxList<MessageColor>.of(logInfos));
  }

  void setRoomEngine(TUIRoomEngine roomEngine) {
    _roomEngine = roomEngine;
  }

  void addObserver() {
      var observer = TUIRoomObserver(
          onReceiveTextMessage: (roomId, message) {
            addMessageLog([
              MessageColor(message.userName, Color(0xFFFCAF41)),
              MessageColor(": ${message.message}", null)
            ]);
          });
      _roomEngine.addObserver(observer);
  }

  void toggleBarrageSlider() {
    isBarrageSliderOn.value = !isBarrageSliderOn.value;
  }

  void setInputText(String value) {
    inputText.value = value;
  }

  void clearInputText() {
    inputText.value = '';
  }

  void sendBarrageMessages(String message) {
      _roomEngine.sendTextMessage(message);
  }

  void onSubmitted() {
    clearInputText();
  }

  void setIsShowComment(bool showCommentState) {
    isShowComment.value = showCommentState;
    if (isShowComment.value) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        inputFocusNode.requestFocus();
      });
    } else {
      inputFocusNode.unfocus();
    }
  }
}