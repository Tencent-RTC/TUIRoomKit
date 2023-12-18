import 'package:flutter/material.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

class BottomSheetWidget extends StatelessWidget {
  final Widget child;
  final double width;
  final double height;
  final EdgeInsetsGeometry? padding;
  const BottomSheetWidget(
      {super.key,
      required this.width,
      required this.height,
      required this.child,
      this.padding});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: RoomColors.mainBlack,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20.0),
          topRight: Radius.circular(20.0),
        ),
      ),
      padding: padding ??
          EdgeInsets.only(
            left: 16.0.scale375(),
            right: 16.0.scale375(),
          ),
      width: width,
      height: height,
      child: child,
    );
  }
}
