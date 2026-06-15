<template>
  <TUISelect :model-value="modelValue" @update:model-value="handleUpdate">
    <TUIOption
      v-for="option in timezoneOptions"
      :key="option.value"
      :value="option.value"
      :label="option.label"
    />
  </TUISelect>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useUIKit();

// 时区数据结构
const timezoneData = [
  { offset: 'UTC-12:00', cityKey: 'ScheduleRoomPanel.BakerIsland', cityEn: 'ScheduleRoomPanel.BakerIsland', value: 'Etc/GMT+12' },
  { offset: 'UTC-11:00', cityKey: 'ScheduleRoomPanel.Samoa', cityEn: 'ScheduleRoomPanel.Samoa', value: 'Pacific/Samoa' },
  { offset: 'UTC-10:00', cityKey: 'ScheduleRoomPanel.Hawaii', cityEn: 'ScheduleRoomPanel.Hawaii', value: 'Pacific/Honolulu' },
  { offset: 'UTC-09:00', cityKey: 'ScheduleRoomPanel.Alaska', cityEn: 'ScheduleRoomPanel.Alaska', value: 'America/Anchorage' },
  { offset: 'UTC-08:00', cityKey: 'ScheduleRoomPanel.LosAngeles', cityEn: 'ScheduleRoomPanel.LosAngeles', value: 'America/Los_Angeles' },
  { offset: 'UTC-07:00', cityKey: 'ScheduleRoomPanel.Denver', cityEn: 'ScheduleRoomPanel.Denver', value: 'America/Denver' },
  { offset: 'UTC-06:00', cityKey: 'ScheduleRoomPanel.Chicago', cityEn: 'ScheduleRoomPanel.Chicago', value: 'America/Chicago' },
  { offset: 'UTC-05:00', cityKey: 'ScheduleRoomPanel.NewYork', cityEn: 'ScheduleRoomPanel.NewYork', value: 'America/New_York' },
  { offset: 'UTC-04:00', cityKey: 'ScheduleRoomPanel.Halifax', cityEn: 'ScheduleRoomPanel.Halifax', value: 'America/Halifax' },
  { offset: 'UTC-03:00', cityKey: 'ScheduleRoomPanel.BuenosAires', cityEn: 'ScheduleRoomPanel.BuenosAires', value: 'America/Argentina/Buenos_Aires' },
  { offset: 'UTC-02:00', cityKey: 'ScheduleRoomPanel.MidAtlantic', cityEn: 'ScheduleRoomPanel.MidAtlantic', value: 'Etc/GMT+2' },
  { offset: 'UTC-01:00', cityKey: 'ScheduleRoomPanel.Azores', cityEn: 'ScheduleRoomPanel.Azores', value: 'Atlantic/Azores' },
  { offset: 'UTC+00:00', cityKey: 'ScheduleRoomPanel.London', cityEn: 'ScheduleRoomPanel.London', value: 'Europe/London' },
  { offset: 'UTC+01:00', cityKey: 'ScheduleRoomPanel.Berlin', cityEn: 'ScheduleRoomPanel.Berlin', value: 'Europe/Berlin' },
  { offset: 'UTC+02:00', cityKey: 'ScheduleRoomPanel.Cairo', cityEn: 'ScheduleRoomPanel.Cairo', value: 'Africa/Cairo' },
  { offset: 'UTC+03:00', cityKey: 'ScheduleRoomPanel.Moscow', cityEn: 'ScheduleRoomPanel.Moscow', value: 'Europe/Moscow' },
  { offset: 'UTC+04:00', cityKey: 'ScheduleRoomPanel.Dubai', cityEn: 'ScheduleRoomPanel.Dubai', value: 'Asia/Dubai' },
  { offset: 'UTC+05:00', cityKey: 'ScheduleRoomPanel.Karachi', cityEn: 'ScheduleRoomPanel.Karachi', value: 'Asia/Karachi' },
  { offset: 'UTC+05:30', cityKey: 'ScheduleRoomPanel.Mumbai', cityEn: 'ScheduleRoomPanel.Mumbai', value: 'Asia/Kolkata' },
  { offset: 'UTC+06:00', cityKey: 'ScheduleRoomPanel.Dhaka', cityEn: 'ScheduleRoomPanel.Dhaka', value: 'Asia/Dhaka' },
  { offset: 'UTC+07:00', cityKey: 'ScheduleRoomPanel.Bangkok', cityEn: 'ScheduleRoomPanel.Bangkok', value: 'Asia/Bangkok' },
  { offset: 'UTC+08:00', cityKey: 'ScheduleRoomPanel.Beijing', cityEn: 'ScheduleRoomPanel.Beijing', value: 'Asia/Shanghai' },
  { offset: 'UTC+09:00', cityKey: 'ScheduleRoomPanel.Tokyo', cityEn: 'ScheduleRoomPanel.Tokyo', value: 'Asia/Tokyo' },
  { offset: 'UTC+10:00', cityKey: 'ScheduleRoomPanel.Sydney', cityEn: 'ScheduleRoomPanel.Sydney', value: 'Australia/Sydney' },
  { offset: 'UTC+11:00', cityKey: 'ScheduleRoomPanel.SolomonIslands', cityEn: 'ScheduleRoomPanel.SolomonIslands', value: 'Pacific/Guadalcanal' },
  { offset: 'UTC+12:00', cityKey: 'ScheduleRoomPanel.Auckland', cityEn: 'ScheduleRoomPanel.Auckland', value: 'Pacific/Auckland' },
];

// 动态生成时区选项，支持中英文显示
const timezoneOptions = computed(() =>
  timezoneData.map(tz => ({
    label: `${tz.offset} (${t(tz.cityKey)})`,
    value: tz.value,
  })),
);

const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};
</script>
