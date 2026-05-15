<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronDown, Stethoscope, User, Lock, Shield } from '@/shared/icons';
import { useLoginState, useRoomEngine } from 'tuikit-atomicx-vue3/room';
import { MEDICAL_MODE } from '@/config/runtime-config';
import { getBasicInfo } from '@/config/basic-info-config';
import {
  services,
  type LaunchContext,
  type UserRole,
} from '@/services/adapters';
import { getDefaultRoute } from '@/utils/navigation';
import { saveSession } from '@/utils/session';
import MedicalButton from '@/components/MedicalButton.vue';

const router = useRouter();
const loginState = useLoginState();

const activeRole = ref<UserRole>('doctor');
const doctorUsers = computed(() => services.user.listDoctors());
const patientUsers = computed(() => services.user.listPatients());
const selectedDoctorId = ref('');
const selectedPatientId = ref('');
const loading = ref(false);
const errorMessage = ref('');
const launchHint = ref('');
const accountDropdownVisible = ref(false);

const doctorOptions = computed(() => doctorUsers.value);
const patientOptions = computed(() => patientUsers.value);
const accountOptions = computed(() =>
  activeRole.value === 'doctor' ? doctorOptions.value : patientOptions.value
);
const selectedAccountId = computed(() =>
  activeRole.value === 'doctor'
    ? selectedDoctorId.value
    : selectedPatientId.value
);
const selectedAccount = computed(() =>
  services.user.getUserById(selectedAccountId.value)
);
const selectedAccountLabel = computed(() => {
  const currentUser = selectedAccount.value;
  if (!currentUser) {
    return '请选择账号';
  }
  if (currentUser.role === 'doctor') {
    return `${currentUser.userName} / ${currentUser.department} / ${currentUser.hospital}`;
  }
  return `${currentUser.userName} / ${currentUser.userId}`;
});

function selectAccount(userId: string) {
  if (activeRole.value === 'doctor') {
    selectedDoctorId.value = userId;
  } else {
    selectedPatientId.value = userId;
  }
  accountDropdownVisible.value = false;
}

function switchRole(role: UserRole) {
  activeRole.value = role;
  accountDropdownVisible.value = false;
}

function buildLaunchContext(): LaunchContext | null {
  const currentId =
    activeRole.value === 'doctor'
      ? selectedDoctorId.value
      : selectedPatientId.value;
  const currentUser = services.user.getUserById(currentId);
  if (!currentUser) {
    return null;
  }
  return {
    role: currentUser.role,
    userId: currentUser.userId,
    userName: currentUser.userName,
    avatarUrl: currentUser.avatarUrl,
  };
}

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';
  const launchContext = buildLaunchContext();
  const currentUser = launchContext
    ? services.user.getUserById(launchContext.userId)
    : null;

  if (!launchContext || !currentUser) {
    errorMessage.value = '未找到预置演示账号';
    loading.value = false;
    return;
  }

  try {
    await loginState.login(getBasicInfo(currentUser.userId));
    await loginState.setSelfInfo({
      userName: currentUser.userName,
      avatarUrl: currentUser.avatarUrl,
    });
    const session = await services.auth.login(launchContext);
    saveSession(session);
    const roomEngine = useRoomEngine()?.instance;
    const tim = roomEngine?.getTIM();
    tim?.callExperimentalAPI('reportTUIFeatureUsage', {
      atomicStoreID: 1206,
      uiPlatform: 50,
    });
    router.replace(getDefaultRoute(currentUser.role, session.appointmentId));
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '登录失败，请检查 SDK 配置';
  } finally {
    loading.value = false;
  }
}

async function tryIntegrationLogin() {
  if (MEDICAL_MODE !== 'integration') {
    return;
  }

  const launchContext = services.auth.getLaunchContext();
  if (!launchContext) {
    launchHint.value =
      '当前为 integration 模式。请由业务系统通过 URL 注入 role、userId、appointmentId、token 等参数后进入。';
    return;
  }

  loading.value = true;
  try {
    const session = await services.auth.login(launchContext);
    const currentUser = session.user ||
      services.user.getUserById(session.userId) || {
        userId: session.userId,
        userName: launchContext.userName || session.userId,
        avatarUrl: launchContext.avatarUrl || '',
        role: session.role,
      };
    await loginState.login(getBasicInfo(session.userId));
    await loginState.setSelfInfo({
      userName: currentUser.userName,
      avatarUrl: currentUser.avatarUrl,
    });
    saveSession({ ...session, user: currentUser });
    router.replace(getDefaultRoute(session.role, session.appointmentId));
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '接入模式初始化失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  selectedDoctorId.value = doctorOptions.value[0]?.userId || '';
  selectedPatientId.value = patientOptions.value[0]?.userId || '';
  void tryIntegrationLogin();
});
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-[#F8FAFB] via-[#E0F2F1] to-[#F1F5F9] px-4 py-6 md:flex md:items-center md:justify-center"
    @click="accountDropdownVisible = false"
  >
    <div
      class="mx-auto grid w-full max-w-md gap-0 overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:max-w-5xl md:grid-cols-2"
    >
      <div
        class="bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-6 text-white md:flex md:flex-col md:justify-between md:p-12"
      >
        <div>
          <div class="mb-5 flex items-center gap-3 md:mb-8">
            <div class="rounded-2xl bg-white/10 p-2.5 backdrop-blur-sm md:p-3">
              <Stethoscope class="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <div>
              <h1 class="text-xl font-semibold md:text-2xl">示例医疗平台</h1>
              <p class="text-white/80 text-sm">Medical Consultation Template</p>
            </div>
          </div>

          <div class="mt-6 space-y-4 md:mt-12 md:space-y-6">
            <div class="flex items-start gap-4">
              <div class="bg-white/10 backdrop-blur-sm p-2 rounded-lg mt-1">
                <Shield :size="20" />
              </div>
              <div>
                <h3 class="font-medium mb-1">音视频安全底座</h3>
                <p class="text-white/70 text-sm">
                  提供稳定音视频链路，可按客户要求接入业务安全体系
                </p>
              </div>
            </div>

            <div class="hidden items-start gap-4 sm:flex">
              <div class="bg-white/10 backdrop-blur-sm p-2 rounded-lg mt-1">
                <Stethoscope :size="20" />
              </div>
              <div>
                <h3 class="font-medium mb-1">完整诊疗闭环</h3>
                <p class="text-white/70 text-sm">
                  从预约到处方，全流程数字化管理
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 text-xs text-white/60 md:mt-0">
          <p>© 示例医疗平台 | 医疗场景源码模板</p>
        </div>
      </div>

      <div class="flex flex-col justify-center p-6 md:p-12">
        <div class="mb-6 md:mb-8">
          <h2 class="mb-2 text-xl font-semibold text-gray-900 md:text-2xl">
            {{ MEDICAL_MODE === 'mock' ? '场景化演示入口' : '接入入口示例' }}
          </h2>
          <p class="text-sm leading-6 text-gray-500 md:text-base">
            {{
              MEDICAL_MODE === 'mock'
                ? '请选择预置身份快速体验医患链路'
                : '集成模式下建议由客户业务系统携带参数直接跳转进入'
            }}
          </p>
        </div>

        <div v-if="MEDICAL_MODE === 'mock'" class="w-full">
          <div
            class="mb-6 grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1 md:mb-8"
          >
            <button
              @click="switchRole('doctor')"
              :class="[
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                activeRole === 'doctor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
            >
              <Stethoscope :size="16" />
              医生登录
            </button>
            <button
              @click="switchRole('patient')"
              :class="[
                'px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
                activeRole === 'patient'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900',
              ]"
            >
              <User :size="16" />
              患者登录
            </button>
          </div>

          <div class="space-y-4 md:space-y-5">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ activeRole === 'doctor' ? '医生账号' : '患者账号' }}
              </label>
              <div class="relative" @click.stop>
                <User
                  class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                />
                <button
                  type="button"
                  class="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-left text-base font-medium text-gray-900 shadow-sm outline-none transition-colors hover:border-[#0D9488]/40 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 md:h-14"
                  @click="accountDropdownVisible = !accountDropdownVisible"
                >
                  <span class="block truncate">{{ selectedAccountLabel }}</span>
                </button>
                <ChevronDown
                  :class="[
                    'pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 transition-transform',
                    accountDropdownVisible ? 'rotate-180' : '',
                  ]"
                />
                <div
                  v-if="accountDropdownVisible"
                  class="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.16)]"
                >
                  <button
                    v-for="item in accountOptions"
                    :key="item.userId"
                    type="button"
                    @click="selectAccount(item.userId)"
                    :class="[
                      'flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                      item.userId === selectedAccountId
                        ? 'bg-[#0D9488]/10 text-[#0F766E]'
                        : 'text-gray-700 hover:bg-gray-50',
                    ]"
                  >
                    <span
                      :class="[
                        'h-2 w-2 rounded-full',
                        item.userId === selectedAccountId
                          ? 'bg-[#0D9488]'
                          : 'bg-gray-300',
                      ]"
                    ></span>
                    <span class="min-w-0 flex-1 truncate">
                      {{
                        item.role === 'doctor'
                          ? `${item.userName} / ${item.department} / ${item.hospital}`
                          : `${item.userName} / ${item.userId}`
                      }}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ activeRole === 'doctor' ? '密码' : '预约验证码' }}
              </label>
              <div class="relative">
                <Lock
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                />
                <input
                  :value="activeRole === 'doctor' ? '••••••••' : '2580'"
                  readonly
                  class="h-12 w-full rounded-xl border border-gray-200 px-4 pl-11 focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                />
              </div>
            </div>

            <div
              v-if="activeRole === 'doctor'"
              class="flex items-center justify-between text-sm"
            >
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked
                  class="w-4 h-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span class="text-gray-600">记住登录状态</span>
              </label>
              <button type="button" class="text-[#0D9488] hover:text-[#0F766E]">
                忘记密码？
              </button>
            </div>

            <div v-else class="bg-[#F1F5F9] rounded-xl p-4">
              <p class="text-sm text-gray-600 text-center">
                <span class="text-[#0D9488] font-medium">温馨提示：</span>
                请使用预约时填写的手机号登录
              </p>
            </div>

            <div class="rounded-xl bg-[#F1F5F9] p-3 md:p-4">
              <p class="text-xs text-gray-600 leading-6">
                运行前请先在 <code>src/config/basic-info-config.ts</code> 中填写
                <code>SDKAPPID</code>。正式交付时请改为客户服务端签发
                <code>UserSig</code>。
              </p>
            </div>

            <MedicalButton
              type="button"
              block
              size="lg"
              :loading="loading"
              @click="handleLogin"
            >
              {{
                loading
                  ? '登录中...'
                  : activeRole === 'doctor'
                    ? '登录工作台'
                    : '进入候诊室'
              }}
            </MedicalButton>

            <p class="text-center text-xs text-gray-500 mt-4">
              当前页面用于演示入口与接入方式，客户可替换为自有登录或单点入口
            </p>

            <p v-if="errorMessage" class="text-sm text-red-500">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="rounded-2xl border border-[#0D9488]/20 bg-[#F0FDFA] p-4">
            <p class="text-sm font-medium text-[#0F766E]">Integration 模式</p>
            <p class="mt-2 text-sm leading-6 text-gray-600">
              页面会尝试从 URL 中读取 <code>role</code>、<code>userId</code>、
              <code>appointmentId</code>、<code>token</code> 等参数自动登录。
            </p>
          </div>

          <div
            class="rounded-2xl bg-[#F8FAFC] p-4 text-xs leading-7 text-gray-600"
          >
            <p>医生端示例：</p>
            <p>
              <code>
                ?role=doctor&amp;userId=doctor_li&amp;appointmentId=APT001
              </code>
            </p>
            <p class="mt-2">患者端示例：</p>
            <p>
              <code>
                ?role=patient&amp;userId=patient_zhang&amp;appointmentId=APT001
              </code>
            </p>
          </div>

          <p v-if="launchHint" class="text-sm text-amber-600">
            {{ launchHint }}
          </p>
          <p v-if="errorMessage" class="text-sm text-red-500">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
