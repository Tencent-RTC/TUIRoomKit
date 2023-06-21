import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_tuikit/pages/room_audience/index.dart';

import '../../../common/index.dart';

class BottomViewWidget extends GetView<RoomAudienceController> {
  final isJoinAnchor = false;
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
        Expanded(
          flex: 1,
          child: Container(
            child: Container(),
          ),
        ),
        LiveImgButton(
          imgUrl: isJoinAnchor
              ? AssetsImages.microphoneOff
              : AssetsImages.microphoneOn,
          imgSize: 52,
          onTap: () async {
            ToastUtil.showToast('This feature is currently under development.');
          },
        ),
        LiveImgButton(
          imgUrl: AssetsImages.like,
          imgSize: 52,
          onTap: () {
            ToastUtil.showToast('This feature is currently under development.');
          },
        ),
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
