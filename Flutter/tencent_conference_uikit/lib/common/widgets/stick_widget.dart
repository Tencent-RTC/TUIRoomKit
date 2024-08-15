import 'package:flutter/material.dart';

import 'stick_render.dart';

class StickWidget extends MultiChildRenderObjectWidget {
  StickWidget({
    super.key,
    required stickHeader,
    required stickContent,
  }) : super(
          children: [
            stickContent,
            stickHeader,
          ],
        );

  @override
  StickRender createRenderObject(BuildContext context) {
    return StickRender(scrollable: Scrollable.of(context));
  }

  @override
  void updateRenderObject(BuildContext context, StickRender renderObject) {
    renderObject.scrollable = Scrollable.of(context);
  }
}
