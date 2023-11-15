import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class PreparePage extends GetView<PrepareController> {
  const PreparePage({Key? key}) : super(key: key);

  Widget _buildView() {
    return Column(
      children: [
        const SizedBox(
          height: 96,
        ),
        const TencentCloudLogShowWidget(),
        Expanded(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: SizedBox(
              width: Get.width / 2,
              child: const Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    CreateRoomWidget(),
                    SizedBox(
                      height: 10,
                    ),
                    EnterRoomWidget(),
                    SizedBox(
                      height: 76,
                    ),
                  ]),
            ),
          ),
        )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PrepareController>(
      init: PrepareController(),
      id: "prepare",
      builder: (_) {
        return Scaffold(
          appBar: AppBar(
            title: const ShowUserInfoWidget(),
            backgroundColor: Colors.white,
            iconTheme: const IconThemeData(color: Colors.black),
          ),
          backgroundColor: Colors.white,
          body: SafeArea(child: _buildView()),
        );
      },
    );
  }
}
