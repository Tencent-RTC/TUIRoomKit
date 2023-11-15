import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SingleSelectWidget extends StatelessWidget {
  final List<Widget> items;
  final Widget selectedEffect;
  final Rx<int> selectedIndex = 0.obs;
  final ValueChanged<int> onItemSelected;

  SingleSelectWidget({
    super.key,
    required this.items,
    required this.selectedEffect,
    int defaultSelect = 0,
    required this.onItemSelected,
  }) {
    selectedIndex.value = defaultSelect;
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      separatorBuilder: (context, index) {
        return const Divider(
          height: 34,
        );
      },
      shrinkWrap: true,
      itemCount: items.length,
      itemBuilder: (context, index) {
        return InkWell(
          onTap: () {
            selectedIndex.value = index;
            onItemSelected(index);
          },
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              items[index],
              Obx(
                () => Visibility(
                  visible: selectedIndex.value == index,
                  child: selectedEffect,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
