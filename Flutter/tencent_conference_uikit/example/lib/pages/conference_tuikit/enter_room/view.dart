import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'package:room_flutter_example/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class ConferenceEnterRoomPage extends GetView<EnterRoomController> {
  const ConferenceEnterRoomPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return const Padding(
      padding: EdgeInsets.only(left: 16, right: 16),
      child: Column(
        children: [
          SizedBox(height: 18),
          RoundedContainerWidget(children: [
            InputRoomIdWidget(),
            Divider(
              height: 32.0,
              indent: 0.0,
            ),
            ShowUserNameWidget()
          ]),
          SizedBox(height: 20),
          UserMediaSettingWidget(),
          Expanded(
            child: Align(
              alignment: Alignment(0, -0.84),
              child: EnterRoomButton(),
            ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<EnterRoomController>(
      init: EnterRoomController(),
      id: "enter_room",
      builder: (_) {
        return Scaffold(
          resizeToAvoidBottomInset: false,
          backgroundColor: AppColors.mainBlack,
          appBar: AppBar(
            title: Text('enterRoom'.tr),
          ),
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
