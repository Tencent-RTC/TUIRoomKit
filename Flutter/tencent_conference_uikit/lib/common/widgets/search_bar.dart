import 'package:flutter/material.dart';
import 'package:tencent_conference_uikit/common/index.dart';

class SearchBarWidget extends StatefulWidget {
  final Color? backgroundColor;
  final Color? textColor;
  final Color? iconColor;
  final double? height;
  final double? radius;
  final String? hintText;
  final void Function(String value) searchAction;

  const SearchBarWidget({
    Key? key,
    this.backgroundColor,
    this.textColor,
    this.iconColor,
    this.height,
    this.radius,
    this.hintText,
    required this.searchAction,
  }) : super(key: key);

  @override
  State<StatefulWidget> createState() => _SearchBarWidgetState();
}

class _SearchBarWidgetState extends State<SearchBarWidget> {
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode();
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height ?? 36.0.scale375(),
      child: TextField(
        focusNode: _focusNode,
        style: TextStyle(color: widget.textColor ?? RoomColors.textWhite),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: widget.hintText ?? 'searchMember'.roomTr,
          hintStyle: const TextStyle(color: RoomColors.hintGrey),
          fillColor: widget.backgroundColor ?? RoomColors.lightGrey,
          filled: true,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(widget.radius ?? 10),
            borderSide: const BorderSide(color: Colors.transparent),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(widget.radius ?? 10),
            borderSide: const BorderSide(color: Colors.transparent),
          ),
          prefixIcon:
              Icon(Icons.search, color: widget.iconColor ?? RoomColors.btnGrey),
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
        ),
        onChanged: (value) {
          widget.searchAction(value);
        },
        onTapOutside: (event) {
          _focusNode.unfocus();
        },
      ),
    );
  }
}
