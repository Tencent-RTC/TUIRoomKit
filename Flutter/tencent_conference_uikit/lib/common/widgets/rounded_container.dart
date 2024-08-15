import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class RoundedContainerWidget extends StatelessWidget {
  final Widget child;
  final double radius;
  final double padding;
  final Color color;
  final double? width;
  final double? height;
  const RoundedContainerWidget({
    super.key,
    required this.child,
    this.radius = 12,
    this.padding = 16,
    this.color = RoomColors.lightGrey,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        color: color,
      ),
      width: width,
      height: height,
      child: child,
    );
  }
}
