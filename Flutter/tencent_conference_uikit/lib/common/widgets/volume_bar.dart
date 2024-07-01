import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class VolumeBarWidget extends StatelessWidget {
  final RxInt volume;
  final int? lineWidth;
  final String? imageName;

  const VolumeBarWidget(
      {Key? key, required this.volume, this.lineWidth, this.imageName})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final width = constraints.maxWidth;
        final height = constraints.maxHeight;
        final lineWidth = this.lineWidth ?? 0;
        final volumeAreaLeft = (width * 2 / 7) + lineWidth;
        final volumeAreaTop = height * 0.05 + lineWidth;
        final volumeAreaRight = width - volumeAreaLeft;
        final volumeAreaBottom = height * 0.76 - lineWidth;
        final volumeAreaRadius = (volumeAreaRight - volumeAreaLeft) / 2;

        return Stack(
          children: [
            Image.asset(
              width: width,
              height: height,
              imageName ?? AssetsImages.roomVolumeBarBg,
              package: 'tencent_conference_uikit',
              fit: BoxFit.cover,
            ),
            Obx(
              () => Visibility(
                visible: RoomStore.to.audioSetting.volumePrompt,
                child: CustomPaint(
                  size: Size(width, height),
                  painter: VolumePainter(
                    volume: volume.value,
                    volumeArea: Rect.fromLTRB(volumeAreaLeft, volumeAreaTop,
                        volumeAreaRight, volumeAreaBottom),
                    volumeAreaRadius: volumeAreaRadius,
                    volumeTotalStep: 100,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class VolumePainter extends CustomPainter {
  final int volume;
  final Rect volumeArea;
  final double volumeAreaRadius;
  final int volumeTotalStep;

  VolumePainter({
    required this.volume,
    required this.volumeArea,
    required this.volumeAreaRadius,
    required this.volumeTotalStep,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = RoomColors.fluorescentGreen
      ..style = PaintingStyle.fill;

    final volumeHeight =
        (volumeArea.bottom - volumeArea.top) * volume / volumeTotalStep;
    final clipRect = Rect.fromLTRB(volumeArea.left,
        volumeArea.bottom - volumeHeight, volumeArea.right, volumeArea.bottom);
    canvas.clipRect(clipRect);
    canvas.drawRRect(
        RRect.fromRectAndRadius(volumeArea, Radius.circular(volumeAreaRadius)),
        paint);
  }

  @override
  bool shouldRepaint(covariant VolumePainter oldDelegate) {
    return oldDelegate.volume != volume;
  }
}
