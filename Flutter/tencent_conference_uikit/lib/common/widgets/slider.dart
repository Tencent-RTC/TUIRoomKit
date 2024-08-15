import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class SliderWidget extends StatelessWidget {
  final String prefixText;
  final int value;
  final ValueChanged<int> onChanged;
  final int min;
  final int max;
  final int? divisions;
  const SliderWidget(
      {super.key,
      required this.prefixText,
      required this.value,
      required this.onChanged,
      this.max = 100,
      this.min = 0,
      this.divisions});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          prefixText,
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        const SizedBox(
          width: 8,
        ),
        SliderTheme(
          data: const SliderThemeData(
            overlayShape: RoundSliderOverlayShape(overlayRadius: 0),
          ),
          child: Slider(
            activeColor: RoomColors.btnBackgroundBlue,
            value: value.toDouble(),
            onChanged: (value) {
              onChanged(value.toInt());
            },
            inactiveColor: RoomColors.btnGrey,
            thumbColor: Colors.white,
            max: max.toDouble(),
            min: min.toDouble(),
            divisions: divisions,
          ),
        ),
      ],
    );
  }
}
