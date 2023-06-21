import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/common/components/chat/chat_controller.dart';
import 'package:rtc_room_tuikit/common/components/chat/widgets/live_img_button.dart';
import 'package:rtc_room_tuikit/common/components/chat/widgets/live_text_button.dart';
import 'package:rtc_room_tuikit/common/components/chat/widgets/message_color.dart';

class InputMessageWidget extends StatefulWidget {
  final TUIRoomEngine roomEngine;

  const InputMessageWidget({Key? key, required this.roomEngine}) : super(key: key);

  @override
  _InputMessageWidgetState createState() => _InputMessageWidgetState();
}

class _InputMessageWidgetState extends State<InputMessageWidget> {
  final ChatController chatController = Get.find<ChatController>();

  @override
  void initState() {
    super.initState();
    chatController.setRoomEngine(widget.roomEngine);
    chatController.addObserver();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          if (chatController.inputFocusNode.hasFocus) {
            chatController.setIsShowComment(false);
            chatController.inputFocusNode.unfocus();
          }
        },
        child: Stack(
          children: [
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Obx(
                    () => chatController.isShowComment.value
                    ? AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom),
                  child: getInputMessage(context),
                )
                    : Container(),
              )// 返回一个空的 Container 用于占位，但不显示任何内容
            ),
            Positioned(
              bottom: 10,
              right: 10,
              child: Visibility(
                visible: !chatController.isShowComment.value, // 控制LiveImgButton的显示
                child: LiveImgButton(
                  imgUrl: "assets/images/chat.png",
                  imgSize: 52,
                  onTap: () {
                    chatController.setIsShowComment(true);
                    chatController.inputFocusNode.requestFocus();
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget getInputMessage(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: TextField(
            cursorHeight: 25,
            focusNode: chatController.inputFocusNode,
            onSubmitted: (s) {
              onSubmitted(s, context);
            },
            onChanged: (value) {
              chatController.setInputText(value);
            },
            autofocus: true,
            autocorrect: false,
            textAlign: TextAlign.left,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.send,
            cursorColor: const Color(0x00006fff),
            decoration: InputDecoration(
              border: InputBorder.none,
              isCollapsed: true,
              isDense: true,
              hintText: "defaultDisplayOfBarrage".tr,
              contentPadding: const EdgeInsets.only(
                top: 0,
                bottom: 5,
              ),
            ),
            style: const TextStyle(fontSize: 16, color: Colors.black),
            minLines: 1,
          ),
        ),
        LiveTextButton(
            text: "sendMessage".tr,
            onPressed: () {
              onSubmitted(chatController.inputText.value, context);
            }),
      ],
    );
  }

  onSubmitted(String messageVal, context) async {
    if (messageVal == '') {
      return;
    }
    chatController.sendBarrageMessages(messageVal);

    chatController.addMessageLog(
      [MessageColor("localUserMessagePrefix".tr, const Color(0xFFFC6091)), MessageColor(messageVal, null)],
    );
    chatController.clearInputText();
    chatController.setIsShowComment(false);
  }
}