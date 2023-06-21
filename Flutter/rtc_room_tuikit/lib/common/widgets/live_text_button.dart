import 'package:flutter/material.dart';

class LiveTextButton extends StatelessWidget {
  const LiveTextButton({
    Key? key,
    required this.text,
    this.size,
    this.backgroundColor,
    required this.onPressed,
    this.radius,
    this.textStyle,
  }) : super(key: key);
  final String text;
  final Function onPressed;
  final Size? size;
  final double? radius;
  final Color? backgroundColor;
  final TextStyle? textStyle;
  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ButtonStyle(
          shape: MaterialStateProperty.all(RoundedRectangleBorder(
            side: BorderSide.none,
            borderRadius: BorderRadius.all(
                Radius.circular(radius != null ? radius! : 20)),
          )),
          backgroundColor: MaterialStateProperty.all(
              backgroundColor != null
                  ? backgroundColor!
                  : const Color(0xFF29CC85)),
          minimumSize: MaterialStateProperty.all(
              size != null ? size! : Size(76, 38))),
      child: Text(
        text,
        style: textStyle != null
            ? textStyle!
            : const TextStyle(color: Colors.white, fontSize: 14),
      ),
      onPressed: () {
        onPressed();
      },
    );
  }
}
