import { ref, computed, watch } from 'vue';
import type { ComputedRef } from 'vue';
import { StreamInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';

export default function useMultiStreamViewHook(props) {
  const roomStore = useRoomStore();
  const { streamList } = storeToRefs(roomStore);

  const isHorizontalInfinityLayout = computed(
    () => props.maxColumn === Infinity
  );
  const isVerticalInfinityLayout = computed(() => props.maxRow === Infinity);
  const isEqualPointsLayout = computed(
    () => props.maxColumn !== Infinity && props.maxRow !== Infinity
  );

  const column = computed(() => {
    if (props.maxColumn === Infinity) {
      return props.maxColumn;
    }
    return Math.min(
      Math.ceil(Math.sqrt(renderStreamInfoList.value.length)),
      props.maxColumn
    );
  });
  const row = computed(() => {
    if (props.maxRow === Infinity) {
      return props.maxRow;
    }
    return Math.min(
      Math.ceil(renderStreamInfoList.value.length / column.value),
      props.maxRow
    );
  });

  const currentPageIndex = ref(0);
  const maxCountEveryPage = computed(() => props.maxColumn * props.maxRow);

  const renderStreamInfoList: ComputedRef<StreamInfo[]> = computed(() => {
    if (props.streamInfoList) {
      return props.streamInfoList;
    }
    return streamList.value.filter(
      (item1: StreamInfo) =>
        !props.excludeStreamInfoList?.find(
          (item2: { userId: string; streamType: TUIVideoStreamType }) =>
            item2.userId === item1.userId &&
            item2.streamType === item1.streamType
        )
    );
  });

  watch(
    () => renderStreamInfoList.value.length,
    val => {
      if (isEqualPointsLayout.value) {
        if (
          currentPageIndex.value > 0 &&
          currentPageIndex.value > Math.ceil(val / maxCountEveryPage.value) - 1
        ) {
          currentPageIndex.value = Math.ceil(val / maxCountEveryPage.value) - 1;
        }
      }
    }
  );

  const totalStreamNumber = computed(() => {
    return streamList.value.length;
  });

  const equalPointsLayoutStreamList: ComputedRef<StreamInfo[][]> = computed(
    () => {
      if (isEqualPointsLayout.value) {
        return [...new Array(totalPageNumber.value).keys()].map(
          (pageIndex: number) => {
            return renderStreamInfoList.value.slice(
              pageIndex * maxCountEveryPage.value,
              (pageIndex + 1) * maxCountEveryPage.value
            );
          }
        );
      }
      return [[]];
    }
  );

  const totalPageNumber = computed(() =>
    Math.ceil(renderStreamInfoList.value.length / maxCountEveryPage.value)
  );

  return {
    column,
    row,
    isHorizontalInfinityLayout,
    isVerticalInfinityLayout,
    isEqualPointsLayout,
    maxCountEveryPage,
    streamList,
    renderStreamInfoList,
    equalPointsLayoutStreamList,
    totalStreamNumber,
    totalPageNumber,
    currentPageIndex,
  };
}
