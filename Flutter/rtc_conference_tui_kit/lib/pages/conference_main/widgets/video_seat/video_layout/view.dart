// ignore_for_file: prefer_typing_uninitialized_variables

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/video_seat/video_item/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class VideoLayoutWidget extends GetView<VideoLayoutController> {
  final List<UserModel> userList;
  final startIndex;
  final endIndex;
  final isScreenLayout;
  final isTowUserLayout;
  const VideoLayoutWidget(
      {Key? key,
      required this.userList,
      required this.startIndex,
      required this.endIndex,
      this.isScreenLayout = false,
      this.isTowUserLayout = false})
      : super(key: key);

  Widget _buildView() {
    if (isScreenLayout) {
      return VideoItemWidget(
        isBackGroundVisible: false,
        userModel: RoomStore.to.screenShareUser,
        onVideoViewCreated: (value) {
          controller.setVideoView(
              RoomStore.to.screenShareUser.userId.value, value,
              isScreenStream: true);
        },
      );
    } else if (isTowUserLayout) {
      return Obx(
        () => WithDraggableWindowWidget(
          mainWidget: VideoItemWidget(
            userModel: userList[0],
            onVideoViewCreated: (value) =>
                controller.setVideoView(userList[0].userId.value, value),
          ),
          draggableWidget: userList.length == 2
              ? VideoItemWidget(
                  userModel: userList[1],
                  onVideoViewCreated: (value) =>
                      controller.setVideoView(userList[1].userId.value, value),
                )
              : null,
          draggableWidgetHeight:
              (userList.length == 2 && userList[1].hasVideoStream.value)
                  ? 180.0
                  : 100.0,
        ),
      );
    } else {
      return Padding(
        padding: EdgeInsets.all(8.0.scale375()),
        child: Wrap(
          spacing: 7.0.scale375(),
          runSpacing: 7.0.scale375(),
          alignment: controller.getWrapAlignment(userList),
          runAlignment: controller.getWrapAlignment(userList),
          children: List.generate(
            endIndex - startIndex + 1,
            (index) {
              return VideoItemWidget(
                width: 176.0.scale375(),
                height: 176.0.scale375(),
                userModel: userList[startIndex + index],
                onVideoViewCreated: (value) {
                  controller.setVideoView(
                      userList[startIndex + index].userId.value, value);
                },
              );
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoLayoutController>(
      init: VideoLayoutController(),
      id: "video_layout",
      builder: (_) {
        return SafeArea(
          child: _buildView(),
        );
      },
    );
  }
}
