<template>
  <div class="h-full flex flex-col bg-white">
    <div class="p-6 border-b border-gray-100 shrink-0">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <FileText :size="20" class="text-[#0D9488]" />
            病历表单示例
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            客户可替换为自有 EMR / HIS 表单
          </p>
        </div>
        <span
          class="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"
        >
          业务插槽示例
        </span>
      </div>

      <div class="bg-[#F1F5F9] rounded-xl p-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-gray-600">
            患者：
            <span class="font-medium text-gray-900 ml-1">
              {{ patientInfo.name }} · {{ patientInfo.gender }} ·
              {{ patientInfo.age }}岁
            </span>
          </span>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          主诉 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="formData.chiefComplaint"
          placeholder="请描述患者主要症状及持续时间"
          rows="3"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          现病史 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="formData.presentIllness"
          placeholder="详细描述发病经过、症状变化、既往诊疗情况等"
          rows="4"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">既往史</label>
        <textarea
          v-model="formData.pastHistory"
          placeholder="既往疾病史、手术史、外伤史等"
          rows="2"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          过敏史 <span class="text-red-500">*</span>
        </label>
        <input
          v-model="formData.allergyHistory"
          type="text"
          placeholder="药物过敏、食物过敏等，如无请填写'无'"
          class="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">体格检查</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-600 mb-1 block">体温 (℃)</label>
            <input
              v-model="formData.temperature"
              type="text"
              placeholder="36.5"
              class="w-full h-9 px-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">脉搏 (次/分)</label>
            <input
              v-model="formData.pulse"
              type="text"
              placeholder="75"
              class="w-full h-9 px-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">血压 (mmHg)</label>
            <input
              v-model="formData.bloodPressure"
              type="text"
              placeholder="120/80"
              class="w-full h-9 px-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label class="text-xs text-gray-600 mb-1 block">呼吸 (次/分)</label>
            <input
              v-model="formData.respiration"
              type="text"
              placeholder="18"
              class="w-full h-9 px-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">辅助检查</label>
        <textarea
          v-model="formData.auxiliaryExam"
          placeholder="血常规、影像学检查等结果"
          rows="3"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          初步诊断 <span class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <input
            v-model="formData.diagnosis"
            type="text"
            placeholder="请输入诊断结果"
            class="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
          <button
            class="text-sm text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1"
          >
            <Search :size="14" />
            查询ICD-10编码
          </button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          处理意见 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="formData.treatment"
          placeholder="治疗方案、医嘱、注意事项等"
          rows="3"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 resize-none"
        ></textarea>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">复诊建议</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="option in followUpOptions"
            :key="option"
            @click="formData.followUp = option"
            :class="[
              'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
              formData.followUp === option
                ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                : 'border-gray-200 text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ option }}
          </button>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gray-100 shrink-0 bg-gray-50">
      <div class="flex gap-3 mb-3">
        <button
          @click="handleSave"
          class="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl h-11 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Save :size="16" />
          提交示例数据
        </button>
        <button
          class="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          预览
        </button>
      </div>
      <div class="flex items-start gap-2 text-xs text-gray-500">
        <CheckCircle2 :size="12" class="mt-0.5 shrink-0" />
        <p>当前仅演示表单结构与提交流程，实际提交逻辑建议接入客户业务系统</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FileText, Search, Save, CheckCircle2 } from '@/shared/icons';

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  allergy_history?: string;
}

interface MedicalRecordPayload {
  chiefComplaint: string;
  presentIllness: string;
  pastHistory: string;
  allergyHistory: string;
  temperature: string;
  pulse: string;
  bloodPressure: string;
  respiration: string;
  auxiliaryExam: string;
  diagnosis: string;
  treatment: string;
  followUp: string;
}

defineProps<{
  patientInfo: PatientInfo;
}>();

const emit = defineEmits<{
  save: [payload: MedicalRecordPayload];
}>();

const formData = ref<MedicalRecordPayload>({
  chiefComplaint: '',
  presentIllness: '',
  pastHistory: '',
  allergyHistory: '',
  temperature: '',
  pulse: '',
  bloodPressure: '',
  respiration: '',
  auxiliaryExam: '',
  diagnosis: '',
  treatment: '',
  followUp: '',
});

const followUpOptions = ['3天后', '1周后', '2周后', '1个月后'];

const handleSave = () => {
  emit('save', { ...formData.value });
  window.alert('已触发病历示例提交，请在上层接入客户业务系统');
};
</script>
