import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../common/index.dart';
import 'index.dart';
import 'widgets/widgets.dart';

class RoomAudiencePage extends StatefulWidget {
  const RoomAudiencePage({Key? key}) : super(key: key);

  @override
  State<RoomAudiencePage> createState() => _RoomAudiencePageState();
}

class _RoomAudiencePageState extends State<RoomAudiencePage> {
  @override
  Widget build(BuildContext context) {
    return const _RoomAudienceViewGetX();
  }
}

class _RoomAudienceViewGetX extends GetView<RoomAudienceController> {
  final isJoinAnchor = false;
  const _RoomAudienceViewGetX({Key? key}) : super(key: key);

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
    ));
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<RoomAudienceController>(
      init: RoomAudienceController(),
      id: "room_audience",
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
