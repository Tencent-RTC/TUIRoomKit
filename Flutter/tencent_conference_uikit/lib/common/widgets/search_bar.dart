import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class SearchBarWidget extends StatelessWidget {
  final void Function(String value) searchAction;
  final double width;

  const SearchBarWidget({
    Key? key,
    required this.searchAction,
    this.width = 263,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36.0.scale375(),
      width: width.scale375(),
      child: TextField(
        style: const TextStyle(color: RoomColors.textWhite),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: RoomContentsTranslations.translate('searchMember'),
          hintStyle: const TextStyle(color: RoomColors.hintGrey),
          fillColor: RoomColors.lightGrey,
          filled: true,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Colors.transparent),
          ),
          prefixIcon: const Icon(Icons.search, color: RoomColors.btnGrey),
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
        ),
        onChanged: (value) {
          searchAction(value);
        },
      ),
    );
  }
}
