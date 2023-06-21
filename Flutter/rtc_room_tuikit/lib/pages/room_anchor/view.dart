import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../common/index.dart';
import 'index.dart';
import 'widgets/widgets.dart';

class RoomAnchorPage extends StatefulWidget {
  const RoomAnchorPage({Key? key}) : super(key: key);

  @override
  State<RoomAnchorPage> createState() => _RoomAnchorPageState();
}

class _RoomAnchorPageState extends State<RoomAnchorPage> {
  @override
  Widget build(BuildContext context) {
    return const _RoomAnchorViewGetX();
  }
}

class _RoomAnchorViewGetX extends GetView<RoomAnchorController> {
  final isPKing = false;
  const _RoomAnchorViewGetX({Key? key})
      : super(
          key: key,
        );

  Widget _buildView() {
    return Center(
      child: Stack(
        fit: StackFit.expand,
        children: [
          LiveVideoViewWidget(
            roomEngine: controller.roomEngine,
            userId: RoomStore.to.ownerId,
          ),
          const Stack(
            children: [
              Align(
                alignment: Alignment.topLeft,
                child: TopViewWidget(),
              ),
            ],
          ),
          const Positioned(
            bottom: 10,
            left: 10,
            right: 10,
            child: BottomViewWidget(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<RoomAnchorController>(
      init: RoomAnchorController(),
      id: "room_anchor",
      builder: (_) {
        return Scaffold(
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
