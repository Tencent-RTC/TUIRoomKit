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
            Image.asset(
              AssetsImages.roomCopy,
              package: 'rtc_conference_tui_kit',
              width: 25,
              height: 25,
              color: RoomColors.textWhite,
            ),
            const SizedBox(width: 3),
            SizedBox(
              width: 28,
              child: Text(
                RoomContentsTranslations.translate('copy'),
                style: RoomTheme.defaultTheme.textTheme.bodyMedium,
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
