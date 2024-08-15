import 'package:tencent_conference_uikit/common/index.dart';

extension DateTimeExtension on DateTime {
  String get format {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    String hrs = twoDigits(hour);
    String mins = twoDigits(minute);
    return '$year${'year'.roomTr}$month${'month'.roomTr}$day${'day'.roomTr} $hrs:$mins';
  }

  String get formatYMD {
    return '$year${'year'.roomTr}$month${'month'.roomTr}$day${'day'.roomTr}';
  }
}
