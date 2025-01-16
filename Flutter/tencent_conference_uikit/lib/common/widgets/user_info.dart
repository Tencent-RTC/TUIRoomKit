import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';
import 'package:rtc_room_engine/api/room/tui_room_define.dart';

class UserInfoWidget extends StatelessWidget {
  final UserModel userModel;

  const UserInfoWidget({Key? key, required this.userModel}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50.0.scale375(),
      child: Row(
        children: [
          SizedBox(
            height: 40.0.scale375(),
            width: 40.0.scale375(),
            child: ClipOval(
              child: Image.network(
                userModel.userAvatarURL.value,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Image.asset(
                    AssetsImages.roomDefaultAvatar,
                    package: 'tencent_conference_uikit',
                  );
                },
              ),
            ),
          ),
          SizedBox(width: 12.0.scale375()),
          Obx(
            () => SizedBox(
              width: 150.0.scale375(),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    userModel.userId.value ==
                            RoomStore.to.currentUser.userId.value
                        ? '${userModel.userName.value}（${'me'.roomTr}）'
                        : userModel.userName.value.isEmpty
                            ? userModel.userId.value
                            : userModel.userName.value,
                    style: RoomTheme.defaultTheme.textTheme.bodyLarge,
                    textAlign: TextAlign.left,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (userModel.userRole.value == TUIRole.roomOwner) ...[
                    SizedBox(height: 2.0.scale375()),
                    Row(
                      children: [
                        Image.asset(
                          AssetsImages.roomRoleOwner,
                          package: 'tencent_conference_uikit',
                          width: 14.0.scale375(),
                          height: 14.0.scale375(),
                        ),
                        SizedBox(width: 2.0.scale375()),
                        Text('roomOwner'.roomTr,
                            style: const TextStyle(
                                color: RoomColors.btnBlue, fontSize: 12))
                      ],
                    ),
                  ],
                  if (userModel.userRole.value == TUIRole.administrator) ...[
                    SizedBox(height: 2.0.scale375()),
                    Row(
                      children: [
                        Image.asset(
                          AssetsImages.roomRoleAdministrator,
                          package: 'tencent_conference_uikit',
                          width: 14.0.scale375(),
                          height: 14.0.scale375(),
                        ),
                        SizedBox(width: 2.0.scale375()),
                        Text(
                          'roomAdministrator'.roomTr,
                          style: const TextStyle(
                              color: RoomColors.textOrange, fontSize: 12),
                        )
                      ],
                    ),
                  ],
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}
