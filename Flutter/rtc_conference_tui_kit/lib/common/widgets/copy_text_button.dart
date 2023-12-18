import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';

class CopyTextButton extends StatelessWidget {
  final String infoText;
  final String successToast;

  const CopyTextButton({
    Key? key,
    required this.infoText,
    required this.successToast,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RoomColors.btnGrey,
        borderRadius: BorderRadius.circular(5),
      ),
      alignment: Alignment.center,
      width: 60.0.scale375(),
      height: 25.0.scale375(),
      child: GestureDetector(
        onTap: () => {copyAction(infoText, successToast)},
        child: Row(
          children: [
            SizedBox(
              width: 25.0.scale375(),
              child: Image.asset(
                AssetsImages.roomCopy,
                package: 'rtc_conference_tui_kit',
                color: RoomColors.textWhite,
              ),
            ),
            SizedBox(width: 1.0.scale375()),
            SizedBox(
              width: 34.0.scale375(),
              child: Text(
                RoomContentsTranslations.translate('copy'),
                style: RoomTheme.defaultTheme.textTheme.bodyMedium,
                textAlign: TextAlign.center,
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
