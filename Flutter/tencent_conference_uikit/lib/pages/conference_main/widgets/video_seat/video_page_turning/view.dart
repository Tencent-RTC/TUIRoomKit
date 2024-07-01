import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/video_seat/video_layout/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class VideoPageTurningPage extends GetView<VideoPageTurningController> {
  const VideoPageTurningPage({Key? key}) : super(key: key);

  Widget _buildView(Orientation orientation) {
    return Stack(
      children: [
        SizedBox(
          height: orientation == Orientation.portrait
              ? 665.0.scale375Height()
              : Get.height,
          child: Obx(
            () => PageView.builder(
              controller: controller.pageController,
              onPageChanged: (value) {
                controller.currentIndex = value;
              },
              itemBuilder: (context, index) {
                return VideoLayoutWidget(
                  userList: RoomStore.to.roomInfo.isSeatEnabled == true &&
                          RoomStore.to.roomInfo.seatMode ==
                              TUISeatMode.applyToTake
                      ? RoomStore.to.seatedUserList
                      : RoomStore.to.userInfoList,
                  startIndex: controller.getPageStarIndex(index),
                  endIndex: controller.getPageEndIndex(index),
                  isScreenLayout: controller.isScreenShareLayout(index),
                  isTwoUserLayout: controller.isTwoUserLayout(),
                );
              },
              itemCount: controller.getTotalPageCount(),
            ),
          ),
        ),
        Obx(
          () => Visibility(
            visible: controller.getIndicatorVisibility(),
            child: Column(
              children: [
                const Expanded(child: SizedBox()),
                PageIndicatorWidget(
                  currentIndex: controller.currentIndex,
                  pageCount: controller.getTotalPageCount(),
                ),
                Visibility(
                  visible: orientation == Orientation.portrait,
                  child: SizedBox(height: 20.0.scale375()),
                )
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VideoPageTurningController>(
      init: VideoPageTurningController(),
      id: "video_page_turning",
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
