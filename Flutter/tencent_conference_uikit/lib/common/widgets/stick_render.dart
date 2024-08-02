import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

class StickRender extends RenderBox
    with
        ContainerRenderObjectMixin<RenderBox, StickParentData>,
        RenderBoxContainerDefaultsMixin<RenderBox, StickParentData> {
  StickRender({required ScrollableState? scrollable}) {
    _scrollable = scrollable;
  }

  ScrollableState? _scrollable;

  set scrollable(ScrollableState? scrollableState) {
    if (_scrollable == scrollableState) {
      return;
    }
    final ScrollableState? preScroll = _scrollable;
    _scrollable = scrollableState;
    if (attached) {
      preScroll!.position.removeListener(markNeedsLayout);
      scrollableState!.position.addListener(markNeedsLayout);
    }
    markNeedsLayout();
  }

  double getScrollAbleDy() {
    RenderObject renderObject = _scrollable!.context.findRenderObject()!;

    if (!renderObject.attached) {
      return 0;
    }
    try {
      return localToGlobal(Offset.zero, ancestor: renderObject).dy;
    } catch (e) {
      return 0;
    }
  }

  @override
  void attach(owner) {
    _scrollable!.position.addListener(markNeedsLayout);
    super.attach(owner);
  }

  @override
  void detach() {
    _scrollable!.position.removeListener(markNeedsLayout);
    super.detach();
  }

  @override
  bool get isRepaintBoundary => true;

  @override
  double computeMinIntrinsicHeight(double width) {
    return (lastChild!.getMinIntrinsicHeight(width) +
        firstChild!.getMinIntrinsicHeight(width));
  }

  @override
  double computeMaxIntrinsicHeight(double width) {
    return (lastChild!.getMaxIntrinsicHeight(width) +
        firstChild!.getMaxIntrinsicHeight(width));
  }

  @override
  double? computeDistanceToActualBaseline(TextBaseline baseline) {
    return defaultComputeDistanceToHighestActualBaseline(baseline);
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    defaultPaint(context, offset);
  }

  @override
  void setupParentData(RenderObject child) {
    super.setupParentData(child);
    if (child.parentData is! StickParentData) {
      child.parentData = StickParentData();
    }
  }

  @override
  void performLayout() {
    var header = lastChild!;
    var content = firstChild!;

    var loosenConstraints = constraints.loosen();
    content.layout(loosenConstraints, parentUsesSize: true);
    header.layout(loosenConstraints, parentUsesSize: true);

    var contentHeight = content.size.height;
    var headerHeight = header.size.height;

    var width = content.size.width;
    var height = headerHeight + contentHeight;
    size = Size(width, height);

    (content.parentData as StickParentData).offset = Offset(0, headerHeight);

    var headerOffset = height - headerHeight;

    var scrollAbleDy = getScrollAbleDy();

    var realHeaderOffset = math.min(-scrollAbleDy, headerOffset);
    (header.parentData as StickParentData).offset =
        Offset(0, math.max(0, realHeaderOffset));
  }

  @override
  bool hitTestChildren(HitTestResult result, {required Offset position}) {
    return defaultHitTestChildren(result as BoxHitTestResult,
        position: position);
  }
}

class StickParentData extends ContainerBoxParentData<RenderBox> {}
