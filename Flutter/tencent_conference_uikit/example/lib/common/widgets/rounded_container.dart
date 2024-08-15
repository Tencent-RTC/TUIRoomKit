import 'package:flutter/material.dart';

import '../index.dart';

class RoundedContainerWidget extends StatelessWidget {
  final List<Widget> children;
  const RoundedContainerWidget({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: AppColors.lightGrey,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: children,
          ),
        ));
  }
}
