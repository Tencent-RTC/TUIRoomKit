import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class AttendeeItem extends StatelessWidget {
  const AttendeeItem({
    super.key,
    required this.avatarUrl,
    required this.userName,
    required this.userID,
    this.isSelected = false,
    this.isDeleteItem = false,
    this.isNeedSelect = true,
    this.onDeleteButtonPressed,
    this.onTap,
  });

  final String avatarUrl;
  final String userName;
  final String userID;
  final bool isSelected;
  final bool isDeleteItem;
  final bool isNeedSelect;
  final Function? onTap;
  final Function? onDeleteButtonPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap?.call(),
        child: SizedBox(
          height: 52.0.scale375Height(),
          child: Row(
            children: [
              Visibility(
                visible: !isDeleteItem && isNeedSelect,
                child: Image.asset(
                  isSelected
                      ? AssetsImages.roomCheckMark
                      : AssetsImages.roomCheckMarkUnselect,
                  width: 16,
                  height: 16,
                  package: 'tencent_conference_uikit',
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(2),
                  image: DecorationImage(
                    image: NetworkImage(
                      avatarUrl.isEmpty
                          ? Constants.defaultAvatarUrl
                          : avatarUrl,
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '$userID($userName)',
                style:
                    const TextStyle(color: RoomColors.textBlack, fontSize: 14),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              Visibility(
                visible: isDeleteItem,
                child: IconButton(
                  icon: Image.asset(
                    AssetsImages.roomDelete,
                    width: 16,
                    height: 16,
                    package: 'tencent_conference_uikit',
                    fit: BoxFit.contain,
                  ),
                  onPressed: () {
                    onDeleteButtonPressed?.call();
                  },
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
