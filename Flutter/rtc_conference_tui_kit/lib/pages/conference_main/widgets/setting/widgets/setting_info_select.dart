import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_conference_tui_kit/pages/conference_main/widgets/setting/controller.dart';

class SettingInfoSelectWidget extends GetView<SettingController> {
  final String title;
  final List<Widget> items;
  final ValueChanged<int> onItemSelected;
  final int defaultSelect;
  const SettingInfoSelectWidget(
      {super.key,
      required this.title,
      required this.items,
      required this.defaultSelect,
      required this.onItemSelected});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(
          height: 24,
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            InkWell(
              child: Image.asset(
                AssetsImages.roomArrowLeft,
                package: 'rtc_conference_tui_kit',
                width: 16.0,
                height: 16.0,
              ),
              onTap: () => Get.back(),
            ),
            Text(
              title,
              style: RoomTheme.defaultTheme.textTheme.bodyLarge,
            ),
            Container(),
          ],
        ),
        const SizedBox(
          height: 7,
        ),
        const Divider(
          height: 34,
        ),
        SingleChildScrollView(
          child: SingleSelectWidget(
            items: items,
            selectedEffect: Image.asset(
              AssetsImages.roomSettingItemSelected,
              package: 'rtc_conference_tui_kit',
              width: 16.0,
              height: 16.0,
            ),
            defaultSelect: defaultSelect,
            onItemSelected: (value) {
              onItemSelected(value);
            },
          ),
        ),
        const Divider(
          height: 34,
        ),
      ],
    );
  }
}
