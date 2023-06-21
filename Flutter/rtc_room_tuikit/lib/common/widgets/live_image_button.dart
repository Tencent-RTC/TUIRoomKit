import 'package:flutter/material.dart';

class LiveImgButton extends StatelessWidget {
  const LiveImgButton(
      {Key? key, required this.onTap, required this.imgUrl, this.imgSize = 32})
      : super(key: key);
  final Function onTap;
  final String imgUrl;
  final double imgSize;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(5),
      child: InkWell(
        onTap: () {
          onTap();
        },
        child: Image.asset(
          imgUrl,
          package: 'rtc_room_tuikit',
          height: imgSize,
          width: imgSize,
        ),
      ),
    );
  }
}
