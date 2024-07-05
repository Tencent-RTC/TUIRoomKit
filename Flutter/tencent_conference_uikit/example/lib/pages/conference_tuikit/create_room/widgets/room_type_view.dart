import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';
import '../../../../common/index.dart';

class RoomTypeViewTopWidget extends GetView<CreateRoomController> {
  const RoomTypeViewTopWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const SizedBox(width: 12),
        ElevatedButton(
          onPressed: () {
            controller.cancelAction();
          },
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor: MaterialStateProperty.all(AppColors.lightGrey),
            minimumSize: MaterialStateProperty.all(const Size(80, 30)),
          ),
          child: Text('cancel'.tr,
              style:
                  const TextStyle(fontSize: 18, color: AppColors.textHintGrey)),
        ),
        const Spacer(),
        ElevatedButton(
          onPressed: () {
            controller.sureAction();
          },
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor: MaterialStateProperty.all(AppColors.lightGrey),
            minimumSize: MaterialStateProperty.all(const Size(80, 30)),
          ),
          child: Text('ok'.tr,
              style: const TextStyle(
                  fontSize: 18, color: AppColors.btnBackgroundBlue)),
        ),
        const SizedBox(width: 12),
      ],
    );
  }
}

class RoomTypeButtonWidget extends GetView<CreateRoomController> {
  const RoomTypeButtonWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(children: [
      RoomTypeButtonCell(roomType: 'freeToSpeakRoom'),
      RoomTypeButtonCell(roomType: 'applyToSpeakRoom'),
    ]);
  }
}

class RoomTypeButtonCell extends GetView<CreateRoomController> {
  final String roomType;

  const RoomTypeButtonCell({
    Key? key,
    required this.roomType,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    double screenWidth = Get.width;
    return Obx(() => ElevatedButton(
          onPressed: () {
            controller.chooseSpeechMode.value = roomType == 'freeToSpeakRoom'
                ? 'freeToSpeakRoom'
                : 'applyToSpeakRoom';
          },
          style: ButtonStyle(
            elevation: MaterialStateProperty.all(0),
            backgroundColor: controller.chooseSpeechMode.value == roomType
                ? MaterialStateProperty.all(AppColors.chosenGrey)
                : MaterialStateProperty.all(AppColors.lightGrey),
            shape: MaterialStateProperty.all(
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(0))),
            minimumSize: MaterialStateProperty.all(Size(screenWidth, 46)),
          ),
          child: Text(roomType.tr, style: Get.textTheme.labelLarge),
        ));
  }
}
