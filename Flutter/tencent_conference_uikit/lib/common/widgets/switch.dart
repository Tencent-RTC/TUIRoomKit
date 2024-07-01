import 'package:flutter/cupertino.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:tencent_conference_uikit/common/style/index.dart';

class SwitchWidget extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  const SwitchWidget({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return CupertinoSwitch(
      value: value,
      onChanged: (value) {
        onChanged(value);
      },
      activeColor: RoomColors.btnBackgroundBlue,
      trackColor: value ? RoomColors.btnBackgroundBlue : RoomColors.btnGrey,
    );
  }
}
