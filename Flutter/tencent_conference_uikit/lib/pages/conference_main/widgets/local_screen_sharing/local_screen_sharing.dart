import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import '../../controller.dart';

class LocalScreenSharingWidget extends GetView<ConferenceMainController> {
  const LocalScreenSharingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Image.asset(
          AssetsImages.roomScreenSharing,
          width: 48,
          height: 48,
          package: 'tencent_conference_uikit',
        ),
        Text(
          RoomContentsTranslations.translate(
            'screenSharingTip',
          ),
          style: RoomTheme.defaultTheme.textTheme.bodyLarge,
        ),
        const SizedBox(
          height: 24,
        ),
        ElevatedButton(
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor:
                MaterialStateProperty.all<Color>(RoomColors.screenBtnTextRed),
            shape: MaterialStateProperty.all(
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(6))),
            padding: MaterialStateProperty.all(
              const EdgeInsets.only(
                  top: 8.0, bottom: 8.0, left: 26.0, right: 26.0),
            ),
          ),
          onPressed: () {
            controller.showDialog();
          },
          child: Text(
            RoomContentsTranslations.translate('stopScreenShare'),
            style: RoomTheme.defaultTheme.textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}
