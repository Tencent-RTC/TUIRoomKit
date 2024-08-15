import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:tencent_conference_uikit/common/index.dart';

import 'index.dart';
import 'widgets/widgets.dart';

/// A widget that displays a list of scheduled conferences grouped by date.
/// If there are no conferences scheduled, a NoScheduleWidget is displayed.
class ConferenceListWidget extends GetView<ConferenceListController> {
  const ConferenceListWidget({Key? key}) : super(key: key);

  Widget _buildView() {
    return Obx(
      () => controller.groupedConferences.value.isNotEmpty
          ? Expanded(
              child: ListView.builder(
                controller: controller.scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: controller.groupedConferences.value.length,
                itemBuilder: (BuildContext context, int index) {
                  var date =
                      controller.groupedConferences.value.keys.elementAt(index);
                  var conferences = controller.groupedConferences.value[date]!;
                  return StickWidget(
                    stickHeader: ConferenceDateItem(date: date.formatYMD),
                    stickContent: Column(
                      children: [
                        ...conferences.map(
                          (conference) =>
                              ConferenceItem(conferenceInfo: conference),
                        ),
                      ],
                    ),
                  );
                },
              ),
            )
          : const NoScheduleWidget(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConferenceListController>(
      init: ConferenceListController(),
      id: "conference_list",
      builder: (_) {
        return _buildView();
      },
    );
  }
}
