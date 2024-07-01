import 'package:get/get.dart';

double screenWidth = Get.width;
double screenHeight = Get.height;

extension DoubleExtension on double {
  double scale375() {
    return this * (screenWidth / 375.00) * 100.truncateToDouble() / 100;
  }

  double scale375Height() {
    return this * (screenHeight / 812.00);
  }
}
