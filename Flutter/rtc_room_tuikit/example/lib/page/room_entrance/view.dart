import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'index.dart';

class RoomEntrancePage extends GetView<RoomEntranceController> {
  final _roomIdController = TextEditingController();
  RoomEntrancePage({Key? key}) : super(key: key);

  Widget _buildRoomIdInputWidget(TextEditingController? roomIdController) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.grey,
      ),
      child: Padding(
        padding:
            const EdgeInsets.only(left: 16.0, right: 16.0, top: 16, bottom: 16),
        child: Row(
          children: [
            SizedBox(
              width: 100,
              child: Text(
                "roomId".tr,
                style: const TextStyle(fontSize: 16, color: Colors.black),
              ),
            ),
            Expanded(
                child: TextField(
              controller: roomIdController,
              decoration: InputDecoration(
                  hintText: "roomIdInputHint".tr,
                  hintStyle: const TextStyle(color: Color(0xffadb6cc)),
                  border: InputBorder.none,
                  isCollapsed: true),
              style: const TextStyle(fontSize: 16, color: Colors.black),
            ))
          ],
        ),
      ),
    );
  }

  Widget _buildEnterRoomButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => {controller.enterRoom(_roomIdController.text)},
        style: ButtonStyle(
            shape: MaterialStateProperty.all(RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            padding: MaterialStateProperty.all(const EdgeInsets.all(16))),
        child: Text("enterRoom".tr),
      ),
    );
  }

  Widget _buildEnterRoomWidget() {
    return SizedBox(
      width: double.infinity,
      child: Column(
        children: [
          _buildRoomIdInputWidget(_roomIdController),
          const SizedBox(height: 24),
          _buildEnterRoomButton(),
        ],
      ),
    );
  }

  Widget _buildCreateRoomButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () => {controller.createRoom()},
        style: ButtonStyle(
            shape: MaterialStateProperty.all(RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            padding: MaterialStateProperty.all(const EdgeInsets.all(16))),
        child: Text("createRoom".tr),
      ),
    );
  }

  // 主视图
  Widget _buildView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(
            left: 24.0, right: 24.0, top: 32.0, bottom: 32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildEnterRoomWidget(),
            const SizedBox(height: 24),
            _buildCreateRoomButton()
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<RoomEntranceController>(
      init: RoomEntranceController(),
      id: "room_entrance",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: const Text(
              "视频互动",
              style: TextStyle(color: Colors.black),
            ),
            centerTitle: true,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios),
              color: Colors.black,
              onPressed: () async {
                Navigator.pushReplacementNamed(
                  context,
                  "/index",
                );
              },
            ),
            elevation: 0,
            backgroundColor: Colors.white,
          ),
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
