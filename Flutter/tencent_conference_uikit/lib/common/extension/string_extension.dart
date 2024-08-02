import 'package:tencent_conference_uikit/common/languages/translation_service.dart';

extension StringExtension on String {
  String get roomTr {
    return RoomContentsTranslations.translate(this);
  }

  String formatStringWithSpaces() {
    StringBuffer buffer = StringBuffer();
    int length = this.length;

    for (int i = 0; i < length; i++) {
      if (i > 0 && i % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(this[i]);
    }

    return buffer.toString();
  }
}
