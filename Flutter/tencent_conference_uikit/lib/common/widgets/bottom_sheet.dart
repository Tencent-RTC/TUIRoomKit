import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

Future<void> showConferenceBottomSheet(Widget bottomSheet,
    {double? landScapeWidth, bool alwaysFromBottom = false}) {
  return showGeneralDialog(
    context: Get.overlayContext!,
    barrierDismissible: true,
    barrierLabel: 'Dismiss bottom sheet',
    transitionDuration: const Duration(milliseconds: 250),
    pageBuilder: (BuildContext context, Animation<double> animation,
        Animation<double> secondaryAnimation) {
      return OrientationBuilder(
        builder: (BuildContext context, Orientation orientation) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: (orientation == Orientation.portrait || alwaysFromBottom)
                  ? const Offset(0, 1)
                  : const Offset(1, 0),
              end: Offset.zero,
            ).animate(animation),
            child: Align(
              alignment:
                  (orientation == Orientation.portrait || alwaysFromBottom)
                      ? Alignment.bottomCenter
                      : Alignment.centerRight,
              child: Material(
                color: Colors.transparent,
                child: SizedBox(
                  width:
                      (orientation == Orientation.portrait || alwaysFromBottom)
                          ? Get.width
                          : landScapeWidth ?? 387.0.scale375(),
                  height:
                      (orientation == Orientation.portrait || alwaysFromBottom)
                          ? null
                          : Get.height,
                  child: bottomSheet,
                ),
              ),
            ),
          );
        },
      );
    },
    routeSettings: const RouteSettings(name: '/bottom_sheet'),
  );
}

class BottomSheetWidget extends StatelessWidget {
  final Widget child;
  final double width;
  final double height;
  final EdgeInsetsGeometry? padding;
  final Orientation orientation;
  final bool isNeedDropDownButton;

  BottomSheetWidget({
    Key? key,
    double? width,
    required this.height,
    required this.child,
    this.padding,
    this.orientation = Orientation.portrait,
    this.isNeedDropDownButton = true,
  })  : width = width ??
            (orientation == Orientation.portrait
                ? Get.width
                : 387.0.scale375()),
        super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: RoomColors.mainBlack,
        borderRadius: orientation == Orientation.portrait
            ? const BorderRadius.only(
                topLeft: Radius.circular(20.0),
                topRight: Radius.circular(20.0),
              )
            : const BorderRadius.only(
                topLeft: Radius.circular(20.0),
                bottomLeft: Radius.circular(20.0),
              ),
      ),
      child: Row(
        children: [
          Visibility(
            visible:
                orientation == Orientation.landscape && isNeedDropDownButton,
            child: const DropDownButton(orientation: Orientation.landscape),
          ),
          Column(
            children: [
              Visibility(
                visible:
                    orientation == Orientation.portrait && isNeedDropDownButton,
                child: const DropDownButton(orientation: Orientation.portrait),
              ),
              Container(
                width: orientation == Orientation.portrait
                    ? width
                    : isNeedDropDownButton
                        ? width - 32.0.scale375()
                        : width - 8.0.scale375(),
                height: orientation == Orientation.portrait
                    ? height - 40.0.scale375()
                    : height,
                padding: padding ??
                    (orientation == Orientation.portrait ||
                            !isNeedDropDownButton
                        ? EdgeInsets.only(
                            left: 16.0.scale375(),
                            right: 16.0.scale375(),
                          )
                        : EdgeInsets.only(right: 12.0.scale375())),
                child: child,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
