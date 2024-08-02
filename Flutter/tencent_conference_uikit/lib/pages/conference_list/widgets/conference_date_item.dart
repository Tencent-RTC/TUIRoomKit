import 'package:flutter/widgets.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class ConferenceDateItem extends StatelessWidget {
  const ConferenceDateItem({super.key, required this.date});

  final String date;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: RoomColors.backgroundGrey,
          height: 20.0,
          child: Row(
            children: [
              Image.asset(
                AssetsImages.roomCalender,
                width: 16,
                height: 16,
                package: 'tencent_conference_uikit',
              ),
              const SizedBox(width: 4),
              Text(
                date,
                style: const TextStyle(
                  fontSize: 14,
                  color: RoomColors.titleTimeGrey,
                ),
              )
            ],
          ),
        ),
        Container(
          height: 20,
          color: RoomColors.backgroundGrey,
        ),
      ],
    );
  }
}
