<template>
  <div class="message-file" @tap="handleOpenFile">
    <svg-icon :icon="FileIcon" class="file-icon" />
    <div class="file-info">
      <div class="file-name">{{ fileName }}</div>
      <div class="file-meta">
        <span>{{ fileSizeText }}</span>
        <span v-if="isUploading">{{ uploadPercent }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TUIMessage from '../../common/base/Message/index';
import SvgIcon from '../../common/base/SvgIcon.vue';
import FileIcon from '../../../assets/icons/FileIcon.svg';
import { useI18n } from '../../../locales';
import {
  canSaveFileToDisk,
  formatFilePayload,
  formatFileSize,
  getFileExtension,
  getSandboxFilePath,
  isDocumentFile,
} from '../util';
import type { MessageFileInfo } from '../../../stores/chat';

const props = defineProps<{
  data?: MessageFileInfo;
  progress?: number;
}>();

const { t } = useI18n();
const fileInfo = computed(() => formatFilePayload(props.data));
const fileName = computed(() => fileInfo.value.fileName || '');
const fileSizeText = computed(() => formatFileSize(fileInfo.value.fileSize));
const isUploading = computed(
  () => props.progress !== undefined && props.progress < 1
);
const uploadPercent = computed(
  () => `${Math.round((props.progress || 0) * 100)}%`
);
let isOpening = false;

function isUserCancel(error: any) {
  return String(error?.errMsg || error?.message || '').includes('cancel');
}

function shareLocalFile(filePath: string, name: string) {
  /**
   * shareFileMessage must be called on wx directly. Extracting the method
   * loses `this` and the WeChat client rejects it.
   * It also has to run in the same tap turn as the user confirm, so the file
   * must already be downloaded before the modal is shown.
   **/
  const wxApi = (globalThis as any).wx;
  if (!wxApi?.shareFileMessage) {
    TUIMessage({ type: 'error', message: t('Failed to forward the file') });
    return;
  }
  wxApi.shareFileMessage({
    filePath,
    fileName: name,
    fail: (error: any) => {
      if (isUserCancel(error)) {
        return;
      }
      TUIMessage({ type: 'error', message: t('Failed to forward the file') });
    },
  });
}

function openLocalFile(filePath: string, name: string) {
  uni.openDocument({
    filePath,
    fileType: getFileExtension(name),
    showMenu: true,
    fail: () => {
      confirmForward(filePath, name);
    },
  });
}

function downloadFile() {
  const { fileUrl } = fileInfo.value;
  if (!fileUrl) {
    return Promise.reject(new Error('file url is empty'));
  }
  return new Promise<string>((resolve, reject) => {
    uni.downloadFile({
      url: fileUrl,
      success: res => {
        if (res.statusCode !== 200 || !res.tempFilePath) {
          reject(new Error('download failed'));
          return;
        }
        /**
         * shareFileMessage accepts the download temp path. saveFile moves that
         * temp file and the new sandbox path often fails to share.
         **/
        resolve(res.tempFilePath);
      },
      fail: reject,
    });
  });
}

async function downloadToSandbox() {
  const name = fileName.value;
  const tempFilePath = await downloadFile();
  const destPath = getSandboxFilePath(name);
  if (!destPath) {
    return tempFilePath;
  }
  return saveTempFile(tempFilePath, destPath);
}

function confirmForward(filePath: string, name = fileName.value) {
  uni.showModal({
    content: t('WeChat on mobile cannot save this file type to your phone'),
    showCancel: true,
    cancelText: t('Cancel'),
    confirmText: t('Forward'),
    success: res => {
      if (!res.confirm) {
        return;
      }
      shareLocalFile(filePath, name);
    },
  });
}

async function prepareForward() {
  isOpening = true;
  uni.showLoading({ title: t('Loading'), mask: true });
  try {
    const filePath = await downloadFile();
    uni.hideLoading();
    confirmForward(filePath, fileName.value);
  } catch (e) {
    uni.hideLoading();
    TUIMessage({ type: 'error', message: t('Failed to download the file') });
  } finally {
    isOpening = false;
  }
}

function saveFileToUserDisk(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    const saveFileToDisk =
      (uni as any).saveFileToDisk ||
      (globalThis as any).wx?.saveFileToDisk;
    if (!saveFileToDisk) {
      reject(new Error('saveFileToDisk is not available'));
      return;
    }
    saveFileToDisk({
      filePath,
      success: () => resolve(),
      fail: reject,
    });
  });
}

function saveTempFile(tempFilePath: string, destPath: string) {
  return new Promise<string>((resolve, reject) => {
    const fs = uni.getFileSystemManager();
    try {
      fs.unlinkSync(destPath);
    } catch (e) {
      // The destination file may not exist yet.
    }
    fs.saveFile({
      tempFilePath,
      filePath: destPath,
      success: res => {
        resolve(res.savedFilePath || destPath);
      },
      fail: () => {
        fs.copyFile({
          srcPath: tempFilePath,
          destPath,
          success: () => resolve(destPath),
          fail: reject,
        });
      },
    });
  });
}

/**
 * downloadFile writes a temp path without the original extension, so
 * openDocument often fails. Save into the mini-program sandbox with the
 * original filename first. Only pdf/doc/xls/ppt can be previewed.
 * Other types can be saved on PC or forwarded to WeChat on mobile.
 **/
const handleOpenFile = () => {
  const { fileUrl } = fileInfo.value;
  const name = fileName.value;
  if (isUploading.value || !fileUrl || isOpening) {
    return;
  }
  const shouldPreview = isDocumentFile(name);
  if (!shouldPreview && !canSaveFileToDisk()) {
    prepareForward();
    return;
  }
  isOpening = true;
  uni.showLoading({ title: t('Loading'), mask: true });
  downloadToSandbox()
    .then(localPath => {
      uni.hideLoading();
      if (shouldPreview) {
        openLocalFile(localPath, name);
        return;
      }
      return saveFileToUserDisk(localPath).then(() => {
        TUIMessage({ type: 'success', message: t('File saved') });
      });
    })
    .catch(() => {
      uni.hideLoading();
      TUIMessage({ type: 'error', message: t('Failed to download the file') });
    })
    .finally(() => {
      isOpening = false;
    });
};
</script>

<style lang="scss" scoped>
.message-file {
  display: flex;
  align-items: center;
  min-width: 140px;
  max-width: 200px;
}

.file-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  margin-right: 8px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  overflow: hidden;
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color-primary);
}

.file-meta {
  display: flex;
  margin-top: 2px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text-color-secondary);

  span + span {
    margin-left: 8px;
  }
}
</style>
