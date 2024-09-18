<template>
  <div class="container">
    <TuiSelect
      v-model="selectedTime"
      theme="white"
      :teleported="false"
      :custom-select-content-style="{ 'font-weight': 400 }"
      :value="selectedTime"
      @input="selectedTime = $event"
    >
      <TuiOption
        v-for="time in timeOptions"
        :key="time.value"
        theme="white"
        :value="time.value"
        :label="time.label"
        :custom-option-content-style="{ 'font-weight': 400 }"
      />
    </TuiSelect>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  defineProps,
  defineEmits,
  watch,
  onMounted,
  onUnmounted,
} from 'vue';
import TuiSelect from '../common/base/Select';
import TuiOption from '../common/base/Option';
import { getLanguage } from '../../utils/common';
import { roomService, EventType, LanguageOption } from '../../services';

interface Props {
  modelValue: string;
}
const props = defineProps<Props>();
const emit = defineEmits(['input']);
const selectedTime = ref(props.modelValue);
const currentLanguage = ref(getLanguage());
const timeOptions = computed(() => {
  switch (currentLanguage.value) {
    case 'zh-CN':
      return timeOptionsCh.value;
    case 'en-US':
      return timeOptionsEn.value;
    default:
      return timeOptionsEn.value;
  }
});
const timeOptionsCh = computed(() => [
  { label: 'GMT-12:00 世界时 - 国际日期变更线西', value: 'Etc/GMT+12' },
  { label: 'GMT-11:00 世界时 - 协调世界时-11', value: 'Etc/GMT+11' },
  { label: 'GMT-10:00 夏威夷 - 阿留申标准时间', value: 'Pacific/Honolulu' },
  { label: 'GMT-09:00 阿拉斯加标准时间', value: 'America/Anchorage' },
  { label: 'GMT-08:00 太平洋标准时间', value: 'America/Los_Angeles' },
  { label: 'GMT-07:00 美国山地标准时间', value: 'America/Denver' },
  { label: 'GMT-06:00 美国中部标准时间', value: 'America/Chicago' },
  { label: 'GMT-05:00 美国东部标准时间', value: 'America/New_York' },
  { label: 'GMT-04:00 大西洋标准时间', value: 'America/Halifax' },
  {
    label: 'GMT-03:00 阿根廷标准时间',
    value: 'America/Argentina/Buenos_Aires',
  },
  { label: 'GMT-02:00 协调世界时-02', value: 'Etc/GMT+2' },
  { label: 'GMT-01:00 佛得角标准时间', value: 'Atlantic/Cape_Verde' },
  { label: 'GMT+00:00 格林威治标准时间', value: 'Europe/London' },
  { label: 'GMT+01:00 中欧标准时间', value: 'Europe/Berlin' },
  { label: 'GMT+02:00 东欧标准时间', value: 'Europe/Kiev' },
  { label: 'GMT+03:00 莫斯科标准时间', value: 'Europe/Moscow' },
  { label: 'GMT+04:00 阿布扎比标准时间', value: 'Asia/Dubai' },
  { label: 'GMT+05:00 巴基斯坦标准时间', value: 'Asia/Karachi' },
  { label: 'GMT+05:30 印度标准时间', value: 'Asia/Kolkata' },
  { label: 'GMT+06:00 孟加拉国标准时间', value: 'Asia/Dhaka' },
  { label: 'GMT+07:00 泰国标准时间', value: 'Asia/Bangkok' },
  { label: 'GMT+08:00 中国标准时间 - 北京', value: 'Asia/Shanghai' },
  { label: 'GMT+09:00 日本标准时间', value: 'Asia/Tokyo' },
  { label: 'GMT+10:00 澳大利亚东部标准时间 - 悉尼', value: 'Australia/Sydney' },
  { label: 'GMT+11:00 所罗门群岛标准时间', value: 'Pacific/Guadalcanal' },
  { label: 'GMT+12:00 新西兰标准时间', value: 'Pacific/Auckland' },
  { label: 'GMT+13:00 汤加标准时间', value: 'Pacific/Tongatapu' },
]);

const timeOptionsEn = computed(() => [
  { label: 'GMT-12:00 International Date Line West', value: 'Etc/GMT+12' },
  { label: 'GMT-11:00 Coordinated Universal Time-11', value: 'Etc/GMT+11' },
  {
    label: 'GMT-10:00 Hawaii-Aleutian Standard Time',
    value: 'Pacific/Honolulu',
  },
  { label: 'GMT-09:00 Alaska Standard Time', value: 'America/Anchorage' },
  { label: 'GMT-08:00 Pacific Standard Time', value: 'America/Los_Angeles' },
  { label: 'GMT-07:00 Mountain Standard Time', value: 'America/Denver' },
  { label: 'GMT-06:00 Central Standard Time', value: 'America/Chicago' },
  { label: 'GMT-05:00 Eastern Standard Time', value: 'America/New_York' },
  { label: 'GMT-04:00 Atlantic Standard Time', value: 'America/Halifax' },
  {
    label: 'GMT-03:00 Argentina Standard Time',
    value: 'America/Argentina/Buenos_Aires',
  },
  { label: 'GMT-02:00 Coordinated Universal Time-02', value: 'Etc/GMT+2' },
  { label: 'GMT-01:00 Cape Verde Standard Time', value: 'Atlantic/Cape_Verde' },
  { label: 'GMT+00:00 Greenwich Mean Time', value: 'Europe/London' },
  { label: 'GMT+01:00 Central European Standard Time', value: 'Europe/Berlin' },
  { label: 'GMT+02:00 Eastern European Standard Time', value: 'Europe/Kiev' },
  { label: 'GMT+03:00 Moscow Standard Time', value: 'Europe/Moscow' },
  { label: 'GMT+04:00 Gulf Standard Time', value: 'Asia/Dubai' },
  { label: 'GMT+05:00 Pakistan Standard Time', value: 'Asia/Karachi' },
  { label: 'GMT+05:30 Indian Standard Time', value: 'Asia/Kolkata' },
  { label: 'GMT+06:00 Bangladesh Standard Time', value: 'Asia/Dhaka' },
  { label: 'GMT+07:00 Indochina Time', value: 'Asia/Bangkok' },
  { label: 'GMT+08:00 China Standard Time - Beijing', value: 'Asia/Shanghai' },
  { label: 'GMT+09:00 Japan Standard Time', value: 'Asia/Tokyo' },
  {
    label: 'GMT+10:00 Australian Eastern Standard Time - Sydney',
    value: 'Australia/Sydney',
  },
  {
    label: 'GMT+11:00 Solomon Islands Standard Time',
    value: 'Pacific/Guadalcanal',
  },
  { label: 'GMT+12:00 New Zealand Standard Time', value: 'Pacific/Auckland' },
  { label: 'GMT+13:00 Tonga Standard Time', value: 'Pacific/Tongatapu' },
]);
const handleLanguageChange = async (language: LanguageOption) => {
  currentLanguage.value = language;
};
onMounted(() => {
  roomService.on(EventType.LANGUAGE_CHANGED, handleLanguageChange);
});

onUnmounted(() => {
  roomService.off(EventType.LANGUAGE_CHANGED, handleLanguageChange);
});

const updateTime = () => {
  emit('input', selectedTime.value);
};

watch(
  selectedTime,
  () => {
    updateTime();
  },
  {
    immediate: true,
  }
);
watch(
  () => props.modelValue,
  newValue => {
    selectedTime.value = newValue;
  },
  { immediate: true }
);
</script>
