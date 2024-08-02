import 'package:get/get.dart';

double _screenWidth = Get.width < Get.height ? Get.width : Get.height;
double _screenHeight = Get.width < Get.height ? Get.height : Get.width;
bool _isPad = _screenWidth > 600;

extension DoubleExtension on double {
  double scale375() {
    return _isPad
        ? this * 1.5
        : this * (_screenWidth / 375.00) * 100.truncateToDouble() / 100;
  }

  double scale375Height() {
    return _isPad ? this * 1.5 : this * (_screenHeight / 812.00);
  }
}
