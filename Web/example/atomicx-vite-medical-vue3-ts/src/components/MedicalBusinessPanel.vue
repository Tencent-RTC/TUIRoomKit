<script setup lang="ts">
import { computed, ref, type Component } from 'vue';
import { FileText, Pill, FolderOpen, LayoutPanelLeft } from '@/shared/icons';
import {
  MEDICAL_BUSINESS_PANEL_MODE,
  MEDICAL_BUSINESS_SLOT_TITLE,
} from '@/config/runtime-config';
import type { MedicalAppointment, MedicalUser } from '@/services/adapters';
import MedicalRecordPanel from '@/components/MedicalRecordPanel.vue';
import PrescriptionPanel from '@/components/PrescriptionPanel.vue';
import MedicalDataPanel from '@/components/MedicalDataPanel.vue';

type BusinessTab = 'record' | 'prescription' | 'data' | 'slot';

const props = defineProps<{
  appointment: MedicalAppointment;
  patient: MedicalUser;
}>();

const activeTab = ref<BusinessTab>(
  MEDICAL_BUSINESS_PANEL_MODE === 'slot' ? 'slot' : 'record'
);

const patientInfo = computed(() => ({
  name: props.patient.userName,
  age: props.appointment.patientAge,
  gender: props.appointment.patientGender,
  allergy_history: props.appointment.allergyHistory,
}));

const tabs = computed<
  Array<{ value: BusinessTab; label: string; icon: Component }>
>(() => {
  const baseTabs: Array<{
    value: BusinessTab;
    label: string;
    icon: Component;
  }> = [
    { value: 'record', label: '病历表单示例', icon: FileText },
    { value: 'prescription', label: '处方表单示例', icon: Pill },
    { value: 'data', label: '检查资料示例', icon: FolderOpen },
  ];

  if (MEDICAL_BUSINESS_PANEL_MODE === 'slot') {
    return [
      { value: 'slot', label: '业务插槽', icon: LayoutPanelLeft },
      ...baseTabs,
    ];
  }

  return baseTabs;
});
</script>

<template>
  <div
    class="h-full min-h-0 bg-white border-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-3xl overflow-hidden flex flex-col"
  >
    <div class="flex-1 min-h-0 flex flex-col">
      <div class="px-5 py-4 border-b border-gray-100 bg-white">
        <h3 class="text-sm font-semibold text-gray-900">业务工作区</h3>
        <p class="mt-1 text-xs text-gray-500">
          中间区域用于承载 EMR、病历、处方、PACS 等客户自有业务系统。
        </p>
      </div>

      <div
        :class="[
          'w-full grid p-2 bg-gray-50 border-b border-gray-100',
          tabs.length > 3 ? 'grid-cols-4' : 'grid-cols-3',
        ]"
      >
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all',
            activeTab === tab.value
              ? 'bg-white text-[#0D9488] shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          ]"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-hidden">
        <div
          v-if="activeTab === 'slot'"
          class="h-full p-6 bg-[linear-gradient(135deg,#F8FAFB_0%,#EEF8F6_100%)]"
        >
          <div
            class="h-full rounded-3xl border border-dashed border-[#0D9488]/30 bg-white/70 px-8 py-10 flex flex-col justify-between"
          >
            <div>
              <div
                class="inline-flex items-center gap-2 rounded-full bg-[#0D9488]/10 text-[#0D9488] px-3 py-1 text-xs font-semibold"
              >
                <LayoutPanelLeft :size="14" />
                业务插槽
              </div>
              <h4 class="mt-4 text-2xl font-semibold text-gray-900">
                {{ MEDICAL_BUSINESS_SLOT_TITLE }}
              </h4>
              <p class="mt-3 text-sm leading-7 text-gray-600">
                这里建议由客户前端团队接入自有的
                EMR、HIS、PACS、处方审核或随访表单。
                音视频主链路、会诊协同、即时呼叫和聊天转录由 SDK 场景模板承载。
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <div class="rounded-2xl bg-white border border-gray-100 p-4">
                <p class="text-sm font-semibold text-gray-900">左侧</p>
                <p class="mt-2 text-xs text-gray-500">音视频画面与设备控制</p>
              </div>
              <div class="rounded-2xl bg-white border border-[#0D9488]/20 p-4">
                <p class="text-sm font-semibold text-[#0D9488]">中间</p>
                <p class="mt-2 text-xs text-gray-500">客户业务系统插槽</p>
              </div>
              <div class="rounded-2xl bg-white border border-gray-100 p-4">
                <p class="text-sm font-semibold text-gray-900">右侧</p>
                <p class="mt-2 text-xs text-gray-500">
                  会诊协同、聊天、转录、成员管理
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'record'" class="h-full overflow-hidden">
          <MedicalRecordPanel :patient-info="patientInfo" />
        </div>
        <div
          v-show="activeTab === 'prescription'"
          class="h-full overflow-hidden"
        >
          <PrescriptionPanel :patient-info="patientInfo" />
        </div>
        <div v-show="activeTab === 'data'" class="h-full overflow-hidden">
          <MedicalDataPanel :patient-info="patientInfo" />
        </div>
      </div>
    </div>
  </div>
</template>
