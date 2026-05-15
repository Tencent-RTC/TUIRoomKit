<template>
  <div class="h-full flex flex-col bg-white">
    <div class="p-6 border-b border-gray-100 shrink-0">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-gray-900 flex items-center gap-2">
            <Pill :size="20" class="text-[#0D9488]" />
            处方表单示例
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            客户可替换为自有处方系统或审核流
          </p>
        </div>
        <span
          class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
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

      <div
        v-if="patientInfo.allergy_history"
        class="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
      >
        <ShieldAlert :size="16" class="text-red-600 mt-0.5 shrink-0" />
        <div>
          <p class="text-xs font-medium text-red-900">过敏史警告</p>
          <p class="text-xs text-red-700 mt-0.5">
            {{ patientInfo.allergy_history }}
          </p>
        </div>
      </div>
    </div>

    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
      <label class="text-gray-700 text-xs mb-2 block font-medium">诊断信息</label>
      <div class="flex gap-2">
        <input
          v-model="diagnosisCode"
          placeholder="请输入诊断（必填）"
          class="flex-1 rounded-xl border border-gray-200 text-sm h-10 px-4 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
        <button
          class="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-100 transition-colors shrink-0"
        >
          ICD-10
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div class="p-6 space-y-4">
        <div
          v-for="(medicine, index) in medicines"
          :key="medicine.id"
          class="p-5 border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-[#0D9488]/30 transition-all duration-200 bg-white group"
        >
          <div class="flex items-start justify-between mb-4">
            <span
              class="text-xs bg-gradient-to-r from-[#0D9488]/10 to-[#0F766E]/10 text-[#0D9488] border border-[#0D9488]/20 px-3 py-1 rounded-full"
            >
              药品 {{ index + 1 }}
            </span>
            <button
              @click="removeMedicine(medicine.id)"
              class="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
            >
              <Trash2 :size="16" />
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="text-xs text-gray-600 mb-1 block">药品名称 *</label>
              <input
                v-model="medicine.name"
                placeholder="请输入药品名称"
                class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
              />
            </div>

            <div>
              <label class="text-xs text-gray-600 mb-1 block">规格</label>
              <input
                v-model="medicine.spec"
                placeholder="如：0.25g*24粒"
                class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-gray-600 mb-1 block">单次剂量</label>
                <input
                  v-model="medicine.dosage"
                  placeholder="如：1粒"
                  class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-gray-600 mb-1 block">频次</label>
                <select
                  v-model="medicine.frequency"
                  class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
                >
                  <option value="qd">每日1次</option>
                  <option value="bid">每日2次</option>
                  <option value="tid">每日3次</option>
                  <option value="qid">每日4次</option>
                  <option value="qn">睡前</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-gray-600 mb-1 block">用药天数</label>
                <input
                  v-model="medicine.duration"
                  type="number"
                  placeholder="天"
                  class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-gray-600 mb-1 block">总量</label>
                <input
                  v-model="medicine.quantity"
                  placeholder="自动计算"
                  class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="text-xs text-gray-600 mb-1 block">用法</label>
              <select
                v-model="medicine.usage"
                class="w-full rounded-xl border border-gray-200 text-sm h-9 px-3 focus:border-[#0D9488] focus:outline-none"
              >
                <option value="口服">口服</option>
                <option value="外用">外用</option>
                <option value="注射">注射</option>
                <option value="雾化">雾化吸入</option>
              </select>
            </div>
          </div>
        </div>

        <button
          @click="addMedicine"
          class="w-full rounded-xl border-dashed border-2 border-gray-300 h-12 gap-2 hover:border-[#0D9488] hover:text-[#0D9488] transition-colors flex items-center justify-center font-medium text-sm text-gray-600"
        >
          <Plus :size="16" />
          添加药品
        </button>

        <div v-if="medicines.length === 0" class="mt-6">
          <label class="text-gray-700 text-sm mb-3 block font-medium">常用药品</label>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="(med, index) in commonMedicines"
              :key="index"
              @click="addCommonMedicine(med)"
              class="justify-start rounded-xl h-auto py-3 px-4 border border-gray-200 hover:border-[#0D9488] hover:bg-[#0D9488]/5 transition-all text-left"
            >
              <p class="text-sm font-medium">{{ med.name }}</p>
              <p class="text-xs text-gray-500">
                {{ med.spec }} · {{ med.category }}
              </p>
            </button>
          </div>
        </div>

        <div
          v-if="medicines.length > 0"
          class="p-4 bg-blue-50 border border-blue-200 rounded-2xl"
        >
          <h4
            class="font-medium text-blue-900 mb-2 text-sm flex items-center gap-2"
          >
            <AlertCircle :size="16" />
            用药指导
          </h4>
          <ul class="text-xs text-blue-800 space-y-1">
            <li>• 请按医嘱规定剂量和时间服药</li>
            <li>• 如出现不适请立即停药并联系医生</li>
            <li>• 妥善保存药品，注意有效期</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gray-100 shrink-0 bg-gray-50">
      <div class="flex gap-3 mb-3">
        <button
          @click="handleIssuePrescription"
          :disabled="medicines.length === 0 || !diagnosisCode"
          class="flex-1 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl h-11 gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center transition-colors"
        >
          <FileText :size="16" />
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
        <p>当前仅演示表单结构与提交流程，实际审核与购药逻辑建议接入客户系统</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  Pill,
  ShieldAlert,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  CheckCircle2,
} from '@/shared/icons';

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  allergy_history?: string;
}

interface Medicine {
  id: string;
  name: string;
  spec: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  usage: string;
}

defineProps<{
  patientInfo: PatientInfo;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      diagnosisCode: string;
      medicines: Medicine[];
    },
  ];
}>();

const medicines = ref<Medicine[]>([]);
const diagnosisCode = ref('');

const commonMedicines = [
  { name: '阿莫西林胶囊', spec: '0.25g*24粒', category: '抗生素' },
  { name: '布洛芬缓释胶囊', spec: '0.3g*20粒', category: '解热镇痛' },
  { name: '氨溴索口服液', spec: '15mg/5ml*100ml', category: '化痰止咳' },
  { name: '蒙脱石散', spec: '3g*10袋', category: '止泻' },
];

const addMedicine = () => {
  const newMedicine: Medicine = {
    id: Date.now().toString(),
    name: '',
    spec: '',
    dosage: '',
    frequency: 'tid',
    duration: '7',
    quantity: '',
    usage: '口服',
  };
  medicines.value.push(newMedicine);
};

const addCommonMedicine = (med: (typeof commonMedicines)[number]) => {
  const newMedicine: Medicine = {
    id: Date.now().toString(),
    name: med.name,
    spec: med.spec,
    dosage: '1粒',
    frequency: 'tid',
    duration: '7',
    quantity: '21粒',
    usage: '口服',
  };
  medicines.value.push(newMedicine);
};

const removeMedicine = (id: string) => {
  medicines.value = medicines.value.filter(item => item.id !== id);
};

const handleIssuePrescription = () => {
  emit('submit', {
    diagnosisCode: diagnosisCode.value,
    medicines: medicines.value.map(item => ({ ...item })),
  });
  window.alert('已触发处方示例提交，请在上层接入客户业务系统');
};
</script>
