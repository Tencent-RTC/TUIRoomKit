import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:rtc_room_tuikit/pages/index.dart';

import '../../../common/index.dart';

class TopViewWidget extends GetView<RoomAnchorController> {
  final isPKing = false;
  final pkUserId = '';
  const TopViewWidget({super.key});

  Widget _buildTopWidget() {
    List<Widget> btnList = (isPKing && pkUserId != '')
        ? [
            LiveTextButton(
              text: "结束PK",
              onPressed: () {},
              backgroundColor: Colors.red,
            )
          ]
        : [
            LiveImgButton(
              imgUrl: AssetsImages.closeRoom,
              onTap: () {
                //Todo destroy
                Get.defaultDialog(
                    title: "Confirm to destroy room",
                    onConfirm: () => controller.destroyRoom(),
                    textConfirm: "confirm",
                    textCancel: "cancel");
              },
            ),
          ];
    btnList.insert(
      0,
      Expanded(
        flex: 1,
        child: Container(
          padding: const EdgeInsets.only(left: 0),
          margin: const EdgeInsets.only(right: 70),
          decoration: const BoxDecoration(
            color: Color.fromRGBO(0, 0, 0, 0.2),
            borderRadius: BorderRadius.all(Radius.circular(26)),
          ),
          constraints: const BoxConstraints(maxWidth: 180, minHeight: 48),
          width: 180,
          height: 48,
          child: Row(
            children: [
              const CircleAvatar(
                radius: 32,
                backgroundImage: NetworkImage(
                  'https://imgcache.qq.com/operation/dianshi/other/5.ca48acfebc4dfb68c6c463c9f33e60cb8d7c9565.png',
                ),
              ),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        height: 6,
                        width: 6,
                        color: Colors.red,
                      ),
                      Padding(
                          padding: const EdgeInsets.only(left: 5),
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 70),
                            child: Text(
                              RoomStore.to.roomName,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white),
                            ),
                          )),
                    ],
                  ),
                  Container(
                    constraints: const BoxConstraints(maxWidth: 80),
                    child: Text(
                      RoomStore.to.roomId,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white),
                    ),
                  )
                ],
              ),
            ],
          ),
        ),
      ),
    );
    return Container(
        margin: const EdgeInsets.only(top: 35, left: 20, right: 10),
        child: Row(
          children: btnList,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return _buildTopWidget();
  }
}
