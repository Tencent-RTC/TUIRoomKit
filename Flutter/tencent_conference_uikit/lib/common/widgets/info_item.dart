import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class InfoItemWidget extends StatelessWidget {
  final String prefixText;
  final String? infoText;
  final Widget? infoWidget;
  final Widget? child;
  final VoidCallback? onTap;
  final TextStyle? prefixTextStyle;
  final TextStyle? infoTextStyle;
  final bool isTextField;
  final bool isLeftAlign;
  final int prefixTextFlex;
  final int infoTextFlex;
  final double? endPadding;
  final TextEditingController? textEditingController;

  const InfoItemWidget({
    Key? key,
    required this.prefixText,
    this.infoText,
    this.infoWidget,
    this.child,
    this.onTap,
    this.prefixTextStyle,
    this.infoTextStyle,
    this.isTextField = false,
    this.isLeftAlign = false,
    this.prefixTextFlex = 1,
    this.infoTextFlex = 3,
    this.endPadding,
    this.textEditingController,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(
            flex: prefixTextFlex,
            child: Text(
              prefixText,
              style: prefixTextStyle ??
                  const TextStyle(fontSize: 16, color: RoomColors.titleBlack),
            ),
          ),
          SizedBox(width: 20.0.scale375()),
          Expanded(
            flex: infoTextFlex,
            child: isTextField
                ? TextField(
                    controller: textEditingController ??
                        TextEditingController(text: infoText),
                    style: infoTextStyle ??
                        const TextStyle(
                            fontSize: 16, color: RoomColors.infoBlack),
                    textAlign: isLeftAlign ? TextAlign.left : TextAlign.right,
                    textAlignVertical: TextAlignVertical.center,
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      isCollapsed: true,
                    ),
                  )
                : infoWidget ??
                    Text(
                      infoText!,
                      textAlign: isLeftAlign ? TextAlign.left : TextAlign.right,
                      style: infoTextStyle ??
                          const TextStyle(
                              fontSize: 16, color: RoomColors.infoBlack),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
          ),
          SizedBox(width: endPadding != null ? endPadding! + 2 : 0),
          child != null
              ? Row(children: [SizedBox(width: 4.0.scale375()), child!])
              : const SizedBox(),
        ],
      ),
    );
  }
}
