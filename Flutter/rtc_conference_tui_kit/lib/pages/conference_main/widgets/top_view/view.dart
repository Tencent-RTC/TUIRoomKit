import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/widgets.dart';

import 'widgets/widgets.dart';

class TopViewWidget extends GetView<TopViewController> {
  const TopViewWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return Container(
      width: Get.width,
      height: 105.0.scale375(),
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage(AssetsImages.roomTopBackGround,
              package: 'rtc_conference_tui_kit'),
          fit: BoxFit.cover,
        ),
      ),
      child: Column(
        children: [
          SizedBox(height: 52.0.scale375()),
          Obx(
            () => Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 12.0.scale375()),
                TopButtonItemWidget(
                    image: Image.asset(
                      AssetsImages.roomEarpiece,
                      package: 'rtc_conference_tui_kit',
                      width: 20,
                      height: 20,
                    ),
                    selectedImage: Image.asset(AssetsImages.roomSpeakerphone,
                        package: 'rtc_conference_tui_kit',
                        width: 20,
                        height: 20),
                    onPressed: () => {controller.switchSpeakerAction()},
                    isSelected: RoomStore.to.audioSetting.isSoundOnSpeaker),
                RoomStore.to.currentUser.hasVideoStream.value
                    ? TopButtonItemWidget(
                        image: Image.asset(AssetsImages.roomSwitchCamera,
                            package: 'rtc_conference_tui_kit',
                            width: 20,
                            height: 20),
                        onPressed: () => {controller.switchCameraAction()},
                        isSelected: false.obs,
                      )
                    : SizedBox(width: 40.0.scale375()),
                const Spacer(),
                const MeetingTitleWidget(),
                const Spacer(),
                TopButtonItemWidget(
                  image: Image.asset(
                    AssetsImages.roomExit,
                    package: 'rtc_conference_tui_kit',
                    width: 20,
                    height: 20,
                  ),
                  onPressed: () => {Get.bottomSheet(const ExitWidget())},
                  isSelected: false.obs,
                  text: RoomContentsTranslations.translate('exit'),
                ),
                SizedBox(width: 12.0.scale375()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<TopViewController>(
      init: TopViewController(),
      id: "topview",
      builder: (_) {
        return Container(
          color: RoomColors.darkBlack,
          child: _buildView(),
        );
      },
    );
  }
}
