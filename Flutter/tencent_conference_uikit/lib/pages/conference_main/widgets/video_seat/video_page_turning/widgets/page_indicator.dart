import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

enum IndicatorShape { circle, square, roundedRectangle }

enum IndicatorAlign { top, bottom }

class PageIndicatorWidget extends StatelessWidget {
  final int currentIndex;
  final int pageCount;
  final Color color;
  final Color activeColor;
  final double indicatorSize;
  final EdgeInsetsGeometry indicatorPadding;
  final IndicatorShape shape;
  final IndicatorAlign align;
  final double spacing;

  const PageIndicatorWidget({
    Key? key,
    required this.currentIndex,
    required this.pageCount,
    this.color = RoomColors.grey,
    this.activeColor = Colors.white,
    this.indicatorSize = 6,
    this.indicatorPadding = const EdgeInsets.symmetric(horizontal: 4),
    this.shape = IndicatorShape.circle,
    this.align = IndicatorAlign.bottom,
    this.spacing = 4,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: align == IndicatorAlign.top
          ? Alignment.topCenter
          : Alignment.bottomCenter,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            pageCount,
            (index) {
              return Container(
                width: indicatorSize,
                height: indicatorSize,
                margin: indicatorPadding,
                decoration: BoxDecoration(
                  shape: shape == IndicatorShape.circle
                      ? BoxShape.circle
                      : BoxShape.rectangle,
                  borderRadius: shape == IndicatorShape.roundedRectangle
                      ? BorderRadius.circular(4)
                      : null,
                  color: index == currentIndex ? activeColor : color,
                ),
              );
            },
          ).toList(),
        ),
      ),
    );
  }
}
