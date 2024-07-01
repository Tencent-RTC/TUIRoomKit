import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class InfoListItem extends StatelessWidget {
  final String prefixText;
  final String infoText;
  final Widget? child;

  const InfoListItem({
    Key? key,
    required this.prefixText,
    required this.infoText,
    this.child,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 20.0.scale375(),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Text(
              prefixText,
              style: RoomTheme.defaultTheme.textTheme.titleSmall,
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              infoText,
              textAlign: TextAlign.left,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: RoomTheme.defaultTheme.textTheme.bodyMedium,
            ),
          ),
          child != null
              ? child!
              : Container(
                  width: 60.0.scale375(),
                ),
        ],
      ),
    );
  }
}
