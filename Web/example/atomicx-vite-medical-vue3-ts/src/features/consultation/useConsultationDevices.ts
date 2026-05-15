import { ref } from 'vue';

export type DeviceOpenResult =
  | { status: 'fulfilled'; value: unknown }
  | { status: 'rejected'; reason: unknown };

export function useConsultationDevices() {
  const devicePermissionHint = ref('');

  function getDeviceErrorHint(deviceLabel: string, error: unknown) {
    const message = error instanceof Error ? error.message : '';
    return `${deviceLabel}开启失败。请检查浏览器是否允许访问${deviceLabel}、系统隐私权限是否开启，并确认设备未被其他应用占用。${message ? `错误信息：${message}` : ''}`;
  }

  function updateDevicePermissionHint(results: DeviceOpenResult[]) {
    const failedLabels = results
      .map((result, index) => ({
        result,
        label: index === 0 ? '麦克风' : '摄像头',
      }))
      .filter(
        item =>
          item.result.status === 'rejected' ||
          (item.result.status === 'fulfilled' && item.result.value === false)
      )
      .map(item => item.label);

    if (!failedLabels.length) {
      devicePermissionHint.value = '';
      return;
    }

    devicePermissionHint.value = `${failedLabels.join('、')}未成功开启。请检查浏览器权限、系统隐私设置，并确认设备未被其他应用占用。`;
  }

  return {
    devicePermissionHint,
    getDeviceErrorHint,
    updateDevicePermissionHint,
  };
}
