import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/setting/controller.dart';

import 'widgets.dart';

class VideoSettingWidget extends GetView<SettingController> {
  const VideoSettingWidget({super.key});

  Widget _buildFpsSelectWidget() {
    return SettingInfoSelectWidget(
      title: RoomContentsTranslations.translate('videoFps'),
      defaultSelect: controller.getFpsDefaultIndex(),
      items: [
        Text(
          Constants.videoFpsArray.elementAt(0).toString(),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        Text(
          Constants.videoFpsArray.elementAt(1).toString(),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
      ],
      onItemSelected: (value) {
        controller.setVideoFps(value);
      },
    );
  }

  Widget _buildResolutionSelectWidget() {
    return SettingInfoSelectWidget(
      title: RoomContentsTranslations.translate('videoResolution'),
      defaultSelect: controller.getResolutionDefaultIndex(),
      items: [
        Text(
          RoomContentsTranslations.translate(
              Constants.videoResolutionNameArray.elementAt(0)),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        Text(
          RoomContentsTranslations.translate(
              Constants.videoResolutionNameArray.elementAt(1)),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        Text(
          RoomContentsTranslations.translate(
              Constants.videoResolutionNameArray.elementAt(2)),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        Text(
          RoomContentsTranslations.translate(
              Constants.videoResolutionNameArray.elementAt(3)),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
      ],
      onItemSelected: (value) {
        controller.setVideoResolution(value);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      child: Column(
        children: [
          SettingItemWidget(
            title: RoomContentsTranslations.translate('videoResolution'),
            child: InkWell(
              onTap: () {
                Get.bottomSheet(
                  BottomSheetWidget(
                    width: double.infinity,
                    height: Get.height * 0.88,
                    child: _buildResolutionSelectWidget(),
                  ),
                  isScrollControlled: true,
                );
              },
              child: Row(
                children: [
                  Obx(
                    () => Text(
                      RoomContentsTranslations.translate(
                          controller.resolutionName),
                      style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                    ),
                  ),
                  const SizedBox(
                    width: 14,
                  ),
                  Image.asset(
                    AssetsImages.roomArrowRight,
                    package: 'rtc_conference_tui_kit',
                    width: 20.0,
                    height: 20.0,
                  ),
                ],
              ),
            ),
          ),
          const Divider(
            height: 36,
          ),
          SettingItemWidget(
            title: RoomContentsTranslations.translate('videoFps'),
            child: InkWell(
              onTap: () {
                Get.bottomSheet(
                  BottomSheetWidget(
                    width: double.infinity,
                    height: Get.height * 0.88,
                    child: _buildFpsSelectWidget(),
                  ),
                  isScrollControlled: true,
                );
              },
              child: Row(
                children: [
                  Obx(
                    () => Text(
                      '${RoomStore.to.videoSetting.videoFps}',
                      style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                    ),
                  ),
                  const SizedBox(
                    width: 14,
                  ),
                  Image.asset(
                    AssetsImages.roomArrowRight,
                    package: 'rtc_conference_tui_kit',
                    width: 20.0,
                    height: 20.0,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
