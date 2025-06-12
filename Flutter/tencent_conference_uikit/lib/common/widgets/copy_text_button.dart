import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class CopyTextButton extends StatelessWidget {
  final String infoText;
  final String successToast;
  final Color? backgroundColor;
  final Color? textColor;

  const CopyTextButton({
    Key? key,
    required this.infoText,
    required this.successToast,
    this.backgroundColor,
    this.textColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: backgroundColor ?? RoomColors.btnGrey,
        borderRadius: BorderRadius.circular(5.0.scale375()),
      ),
      alignment: Alignment.center,
      width: 62.0.scale375(),
      height: 25.0.scale375(),
      child: GestureDetector(
        onTap: () => {copyAction(infoText, successToast)},
        child: Row(
          children: [
            SizedBox(
              width: 25.0.scale375(),
              child: Image.asset(
                AssetsImages.roomCopy,
                package: 'tencent_conference_uikit',
                color: textColor ?? RoomColors.textWhite,
              ),
            ),
            SizedBox(width: 1.0.scale375()),
            SizedBox(
              width: 36.0.scale375(),
              child: Text(
                'copy'.roomTr,
                style: textColor == null
                    ? RoomTheme.defaultTheme.textTheme.bodyMedium
                    : TextStyle(color: textColor, fontSize: 12),
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void copyAction(String text, String successToast) {
    Clipboard.setData(ClipboardData(text: text));
    makeToast(msg: successToast);
  }
}
