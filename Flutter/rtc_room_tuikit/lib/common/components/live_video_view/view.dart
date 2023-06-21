import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_engine/api/common/tui_video_view.dart';
import 'package:rtc_room_engine/api/room/tui_room_engine.dart';

import 'index.dart';

class LiveVideoViewWidget extends GetView<LiveVideoViewController> {
  final TUIRoomEngine roomEngine;
  final String userId;
  const LiveVideoViewWidget(
      {required this.roomEngine, required this.userId, Key? key})
      : super(key: key);
  Widget _commonVideoView() {
    return VideoView(
      key: const ValueKey("LiveRoomPage_bigVideoViewId"),
      onViewCreated: (viewId) async {
        controller.setVideoView(userId, viewId);
      },
    );
  }

  Widget _pkVideoView(String pkUserId) {
    return Container(
        color: const Color.fromRGBO(0, 0, 0, 0.3),
        padding: const EdgeInsets.only(top: 90),
        child: SizedBox(
          height: 350,
          child: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 180,
                height: 250,
                child: VideoView(
                  key: const ValueKey("PKPreview_VideoViewId"),
                  onViewCreated: (viewId) async {
                    controller.setVideoView(userId, viewId);
                  },
                ),
              ),
              SizedBox(
                width: 180,
                height: 250,
                child: pkUserId != ''
                    ? VideoView(
                        key: const ValueKey("PKPlay_VideoViewId"),
                        onViewCreated: (viewId) async {
                          controller.setVideoView(userId, viewId);
                        },
                      )
                    : Container(),
              ),
            ],
          ),
        ));
  }

  // 主视图
  Widget _buildView() {
    return Center(
      child: controller.isPKing.value ? _pkVideoView("") : _commonVideoView(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<LiveVideoViewController>(
      init: LiveVideoViewController(roomEngine),
      id: "live_video_view",
      builder: (_) {
        return _buildView();
      },
    );
  }
}
