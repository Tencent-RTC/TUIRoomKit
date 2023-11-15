import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'widgets.dart';
import '../index.dart';
import '../../../../common/index.dart';

class RoomInfoWidget extends GetView<CreateRoomController> {
  const RoomInfoWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return RoundedContainerWidget(
      children: [
        Obx(() => RoomInfoCellWidget(
              prefixText: 'roomType'.tr,
              infoText: controller.roomTypeString.value,
              image: Image.asset(
                AssetsImages.dropDown,
                width: 24,
                height: 24,
                color: AppColors.textHintGrey,
              ),
              onTap: () {
                showRoomTypeView();
              },
            )),
        const Divider(height: 32.0),
        RoomInfoCellWidget(
          prefixText: 'roomId'.tr,
          infoText: controller.getRoomId(),
        ),
        const Divider(height: 32.0),
        RoomInfoCellWidget(
          prefixText: 'userName'.tr,
          infoText: UserStore.to.userModel.userName,
        ),
      ],
    );
  }

  void showRoomTypeView() {
    Get.bottomSheet(
      backgroundColor: AppColors.lightGrey,
      barrierColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20.0),
          topRight: Radius.circular(20.0),
        ),
      ),
      const SizedBox(
        height: 221,
        child: Column(
          children: [
            SizedBox(height: 15),
            RoomTypeViewTopWidget(),
            SizedBox(height: 15),
            RoomTypeButtonWidget()
          ],
        ),
      ),
    );
  }
}
