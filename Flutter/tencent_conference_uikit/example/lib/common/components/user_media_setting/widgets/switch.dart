// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

class SwitchWidget extends GetView<UserMediaSettingController> {
  final String text;
  final RxBool value;
  final Function(bool) onValueChanged;

  const SwitchWidget({
    super.key,
    required this.text,
    required this.value,
    required this.onValueChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          text,
          style: Get.textTheme.bodyMedium,
        ),
        Expanded(
          child: Align(
            alignment: Alignment.centerRight,
            child: Obx(() => CupertinoSwitch(
                  value: value.value,
                  onChanged: (value) {
                    onValueChanged(value);
                  },
                  activeColor: AppColors.btnBackgroundBlue,
                  trackColor: value.value
                      ? AppColors.btnBackgroundBlue
                      : AppColors.btnGrey,
                )),
          ),
        )
      ],
    );
  }
}
