import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class DetailsButtonItem extends StatelessWidget {
  const DetailsButtonItem(
      {super.key,
      required this.onPressed,
      required this.title,
      this.textColor,
      this.backgroundColor});

  final Function onPressed;
  final String title;
  final Color? textColor;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 44.0.scale375Height(),
      child: ElevatedButton(
        onPressed: () => onPressed(),
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor ?? RoomColors.newLightGrey,
          elevation: 0,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 16,
            color: textColor ?? RoomColors.btnTextBlue,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
