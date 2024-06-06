// ignore_for_file: prefer_typing_uninitialized_variables

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/video_seat/video_page_turning/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class VideoLayoutWidget extends GetView<VideoLayoutController> {
  final List<UserModel> userList;
  final startIndex;
  final endIndex;
  final isScreenLayout;
  final isTwoUserLayout;
  const VideoLayoutWidget(
      {Key? key,
      required this.userList,
      required this.startIndex,
      required this.endIndex,
      this.isScreenLayout = false,
      this.isTwoUserLayout = false})
      : super(key: key);

  Widget _buildView(Orientation orientation) {
    if (isScreenLayout) {
      var videoPageTurningController = Get.find<VideoPageTurningController>();
      return Obx(
        () => WithDraggableWindowWidget(
          mainWidget: VideoItemWidget(
            isScreenStream: true,
            userModel: RoomStore.to.screenShareUser,
          ),
          draggableWidgetHeight: (orientation == Orientation.portrait &&
                  controller.speakingUser.value.hasVideoStream.value)
              ? 180.0
              : 100.0,
          draggableWidgetWidth: (orientation == Orientation.landscape &&
                  controller.speakingUser.value.hasVideoStream.value)
              ? 180.0
              : 100.0,
          draggableWidget: controller.isDraggableWidgetVisible.value &&
                  videoPageTurningController.isVideoPageStop.value &&
                  RoomStore.to.audioSetting.volumePrompt
              ? VideoItemWidget(
                  userModel: controller.speakingUser.value,
                  isScreenStream: false,
                )
              : null,
          orientation: orientation,
        ),
      );
    } else if (isTwoUserLayout) {
      return Obx(
        () => WithDraggableWindowWidget(
          mainWidget: VideoItemWidget(
            userModel: userList[0],
          ),
          draggableWidget: userList.length == 2
              ? VideoItemWidget(
                  userModel: userList[1],
                  isScreenStream: false,
                )
              : null,
          draggableWidgetHeight: (orientation == Orientation.portrait &&
                  userList.length == 2 &&
                  userList[1].hasVideoStream.value)
              ? 180.0
              : 100.0,
          draggableWidgetWidth: (orientation == Orientation.landscape &&
                  userList.length == 2 &&
                  userList[1].hasVideoStream.value)
              ? 180.0
              : 100.0,
          orientation: orientation,
        ),
      );
    } else {
      return Padding(
        padding: orientation == Orientation.portrait
            ? EdgeInsets.only(
                left: 7.0.scale375(),
                right: 7.0.scale375(),
                top: 47.0.scale375(),
                bottom: 47.0.scale375())
            : EdgeInsets.only(
                top: 7.0.scale375(),
                bottom: 7.0.scale375(),
                left: 53.0.scale375(),
                right: 53.0.scale375()),
        child: SizedBox(
          width: orientation == Orientation.portrait
              ? Get.width - 14.0.scale375()
              : 542.0.scale375(),
          height: orientation == Orientation.portrait
              ? 542.0.scale375Height()
              : Get.height,
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
                );
              },
            ),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoLayoutController>(
      init: VideoLayoutController(),
      autoRemove: false,
      id: "video_layout",
      builder: (_) {
        return OrientationBuilder(
          builder: (BuildContext context, Orientation orientation) {
            return _buildView(orientation);
          },
        );
      },
    );
  }
}
