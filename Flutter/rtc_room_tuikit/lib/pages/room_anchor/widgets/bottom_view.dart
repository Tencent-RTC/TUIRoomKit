import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../common/index.dart';
import '../index.dart';

class BottomViewWidget extends GetView<RoomAnchorController> {
  final isPKing = false;
  final pkUserId = '';
  const BottomViewWidget({super.key});

  Widget _buildBottomWidget() {
    List<Widget> btnList = [];
    {
      btnList = [
        LiveImgButton(
          imgUrl: AssetsImages.chat,
          imgSize: 52,
          onTap: () {
            ToastUtil.showToast('This feature is currently under development.');
          },
        ),
        LiveImgButton(
          imgUrl: AssetsImages.switchCamera,
          imgSize: 52,
          onTap: () {
            controller.switchCamera();
          },
        ),
        LiveImgButton(
          imgUrl: AssetsImages.pk,
          imgSize: 52,
          onTap: () {
            ToastUtil.showToast('This feature is currently under development.');
          },
        ),
        const BeautyButton(),
        const AudioEffectButton()
      ];

      return Container(
        margin: const EdgeInsets.only(bottom: 15),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.max,
          children: btnList,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return _buildBottomWidget();
  }
}
