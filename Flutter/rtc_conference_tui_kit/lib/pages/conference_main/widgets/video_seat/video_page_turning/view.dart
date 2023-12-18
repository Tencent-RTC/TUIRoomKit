import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/video_seat/video_layout/index.dart';
import 'package:rtc_room_engine/rtc_room_engine.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class VideoPageTurningPage extends GetView<VideoPageTurningController> {
  const VideoPageTurningPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: Obx(
            () => PageView.builder(
              onPageChanged: (value) {
                controller.currentIndex = value;
              },
              itemBuilder: (context, index) {
                return VideoLayoutWidget(
                  userList: RoomStore.to.roomInfo.speechMode ==
                          TUISpeechMode.speakAfterTakingSeat
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
            child: PageIndicatorWidget(
              currentIndex: controller.currentIndex,
              pageCount: controller.getTotalPageCount(),
            ),
          ),
        ),
        const SizedBox(
          height: 25,
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
        return _buildView();
      },
    );
  }
}
