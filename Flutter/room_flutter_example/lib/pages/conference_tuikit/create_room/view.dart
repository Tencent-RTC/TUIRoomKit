import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:room_flutter_example/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class ConferenceCreateRoomPage extends GetView<CreateRoomController> {
  const ConferenceCreateRoomPage({Key? key}) : super(key: key);

  Widget _buildView() {
    return const Padding(
      padding: EdgeInsets.only(left: 20, right: 20),
      child: Column(
        children: [
          SizedBox(height: 18),
          RoomInfoWidget(),
          SizedBox(height: 20),
          UserMediaSettingWidget(),
          Expanded(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: EdgeInsets.only(bottom: 40.0),
                child: CreateRoomButtonWidget(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CreateRoomController>(
      init: CreateRoomController(),
      id: "create_room",
      builder: (_) {
        return Scaffold(
          backgroundColor: AppColors.mainBlack,
          appBar: AppBar(title: Text('createRoom'.tr)),
          body: SafeArea(child: _buildView()),
        );
      },
    );
  }
}
