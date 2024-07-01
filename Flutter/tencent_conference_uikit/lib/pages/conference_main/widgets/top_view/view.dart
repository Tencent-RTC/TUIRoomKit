import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/pages/conference_main/widgets/widgets.dart';

import 'widgets/widgets.dart';

class TopViewWidget extends GetView<TopViewController> {
  const TopViewWidget(this.orientation, {Key? key}) : super(key: key);

  final Orientation orientation;

  Widget _buildView() {
    return Container(
      width: Get.width,
      height: orientation == Orientation.portrait
          ? 105.0.scale375()
          : 73.0.scale375(),
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage(
            AssetsImages.roomTopBackGround,
            package: 'tencent_conference_uikit',
          ),
          fit: BoxFit.cover,
        ),
      ),
      child: Column(
        children: [
          SizedBox(
            height: orientation == Orientation.portrait
                ? 44.0.scale375Height()
                : 20.0.scale375(),
          ),
          Obx(
            () => Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(width: 16.0.scale375()),
                TopButtonItemWidget(
                    image: Image.asset(
                      AssetsImages.roomEarpiece,
                      package: 'tencent_conference_uikit',
                      width: 20,
                      height: 20,
                    ),
                    selectedImage: Image.asset(
                      AssetsImages.roomSpeakerphone,
                      package: 'tencent_conference_uikit',
                      width: 20,
                      height: 20,
                    ),
                    onPressed: () => {controller.switchSpeakerAction()},
                    isSelected: RoomStore.to.audioSetting.isSoundOnSpeaker),
                SizedBox(width: 24.0.scale375()),
                RoomStore.to.currentUser.hasVideoStream.value
                    ? TopButtonItemWidget(
                        image: Image.asset(
                          AssetsImages.roomSwitchCamera,
                          package: 'tencent_conference_uikit',
                          width: 20,
                          height: 20,
                        ),
                        onPressed: () => {controller.switchCameraAction()},
                        isSelected: false.obs,
                      )
                    : SizedBox(width: 20.0.scale375()),
                SizedBox(width: 16.0.scale375()),
                const Spacer(),
                MeetingTitleWidget(orientation),
                const Spacer(),
                TopButtonItemWidget(
                  image: Image.asset(
                    AssetsImages.roomExit,
                    package: 'tencent_conference_uikit',
                    width: 20,
                    height: 20,
                  ),
                  onPressed: () => {
                    showConferenceBottomSheet(const ExitWidget(),
                        alwaysFromBottom: true)
                  },
                  isSelected: false.obs,
                  text: RoomContentsTranslations.translate('exit'),
                ),
                SizedBox(width: 16.0.scale375()),
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
      autoRemove: false,
    );
  }
}
