import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class NoScheduleWidget extends StatelessWidget {
  const NoScheduleWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            AssetsImages.roomNoSchedule,
            width: 120.0,
            height: 79.0,
            package: 'tencent_conference_uikit',
          ),
          const SizedBox(height: 30),
          Text(
            'noRoomScheduled'.roomTr,
            style: RoomTheme.defaultTheme.textTheme.titleSmall,
          ),
          LayoutBuilder(
            builder: (BuildContext context, BoxConstraints constraints) {
              Orientation orientation = MediaQuery.of(context).orientation;
              return Visibility(
                visible: orientation == Orientation.portrait,
                child: const SizedBox(height: 100),
              );
            },
          ),
        ],
      ),
    );
  }
}
