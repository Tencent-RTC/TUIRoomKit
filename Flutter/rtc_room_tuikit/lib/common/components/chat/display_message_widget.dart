import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';
import 'package:rtc_room_tuikit/common/components/chat/chat_controller.dart';
import 'package:rtc_room_tuikit/common/components/chat/widgets/message_color.dart';

class DisplayMessageWidget extends StatelessWidget {
  final TUIRoomEngine roomEngine;
  final ChatController chatController;

  DisplayMessageWidget({Key? key, required this.roomEngine})
      : chatController = Get.find<ChatController>(),
        super(key: key) {
    chatController.setRoomEngine(roomEngine);
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0,
      bottom: 120,
      width: 250,
      child: Container(
        height: 200,
        padding: const EdgeInsets.only(left: 10, right: 10),
        child: Obx(() {
          final messageList = chatController.messageLogList.map((rxList) => rxList.toList()).toList();
          return ListView.separated(
            itemCount: messageList.length,
            separatorBuilder: (BuildContext context, int index) => const Divider(),
            padding: const EdgeInsets.only(top: 10, bottom: 0),
            itemBuilder: (context, index) {
              List<MessageColor> msgColorList = messageList[index];
              List<InlineSpan> ls = msgColorList.map((msgObj) {
                return TextSpan(
                  text: msgObj.msg,
                  style: TextStyle(
                    color: msgObj.color ?? Colors.white,
                  ),
                );
              }).toList();
              return Container(
                decoration: const BoxDecoration(
                  color: Color.fromRGBO(0, 0, 0, 0.2),
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
                height: 32,
                padding: const EdgeInsets.only(left: 10, right: 10),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 14,
                      ),
                      children: ls,
                    ),
                  ),
                ),
              );
            },
          );
        }),
      ),
    );
  }
}