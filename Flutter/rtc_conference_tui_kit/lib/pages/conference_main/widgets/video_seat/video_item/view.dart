import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_conference_tui_kit/common/index.dart';
import 'package:rtc_room_engine/api/common/tui_video_view.dart';

import 'widgets/widgets.dart';

class VideoItemWidget extends StatelessWidget {
  final UserModel userModel;
  final ValueChanged<int>? onVideoViewCreated;
  final double? width;
  final double? height;
  final bool isBackGroundVisible;

  const VideoItemWidget({
    Key? key,
    required this.userModel,
    this.onVideoViewCreated,
    this.width,
    this.height,
    this.isBackGroundVisible = true,
  }) : super(key: key);

  Widget _buildView() {
    return Container(
      width: width,
      height: height,
      padding: const EdgeInsets.all(2.0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          alignment: Alignment.center,
          fit: StackFit.expand,
          children: [
            VideoView(
              onViewCreated: (id) {
                onVideoViewCreated!(id);
              },
            ),
            Obx(
              () => Visibility(
                visible: !userModel.hasVideoStream.value && isBackGroundVisible,
                child: Image.asset(
                  AssetsImages.roomVideoBgNoContent,
                  fit: BoxFit.fill,
                  package: 'rtc_conference_tui_kit',
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              child: Align(
                alignment: Alignment.center,
                child: Obx(
                  () => Visibility(
                    visible:
                        isBackGroundVisible && !userModel.hasVideoStream.value,
                    child: SizedBox(
                      width: 50,
                      height: 50,
                      child: ClipOval(
                        child: Image.network(
                          userModel.userAvatarURL.value,
                          errorBuilder: (context, error, stackTrace) {
                            return Image.asset(
                              AssetsImages.roomDefaultAvatar,
                              package: 'rtc_conference_tui_kit',
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Obx(
              () => Visibility(
                visible: userModel.hasAudioStream.value,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                        color: RoomColors.fluorescentGreen, width: 3),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 12,
              left: 7,
              child: VideoUserInfoWidget(
                userModel: userModel,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _buildView();
  }
}
