<template>
  <div v-if="visible" class="vsdk-integration-wrapper">
    <div class="vsdk-integration-bar">
      <a
        class="vsdk-guide-card"
        :href="resolvedGuideUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="vsdk-guide-text">{{ t('IntegrationCard.Description') }}</span>
        <span class="vsdk-guide-cta">
          <span class="vsdk-guide-cta-label">{{ t('IntegrationCard.GuideCTA') }}</span>
          <svg
            class="vsdk-guide-chevron"
            width="6"
            height="10"
            viewBox="0 0 6 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 1L5 5L1 9"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="vsdk-guide-ribbon" aria-hidden="true" />
      </a>

      <a
        class="vsdk-feedback-card"
        :href="surveyUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          class="vsdk-feedback-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="3.5"
            y="2.5"
            width="9"
            height="11"
            rx="1"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <rect x="5.5" y="1" width="5" height="2.5" rx="0.5" fill="currentColor" />
          <path d="M5.5 6.5H10.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
          <path d="M5.5 9H9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
        <span>{{ t('IntegrationCard.FeedbackCTA') }}</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { isPC } from '../../utils/utils';

interface Props {
  guideUrl?: string;
  guideUrlEn?: string;
  surveyUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  guideUrl: 'https://cloud.tencent.com/document/product/647/81962',
  guideUrlEn: 'https://trtc.io/document/54845?product=room&menulabel=uikit&platform=vue',
  surveyUrl: 'https://wj.qq.com/s2/27395009/ac34/',
});

const { t, language } = useUIKit();
const route = useRoute();

const visible = computed(() => isPC && route.path === '/home');

const resolvedGuideUrl = computed(() =>
  String(language.value).startsWith('en') ? props.guideUrlEn : props.guideUrl,
);
</script>

<style>
.vsdk-integration-wrapper {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: max-content;
  max-width: calc(100% - 48px);
}

.vsdk-integration-bar {
  display: flex;
  align-items: center;
  gap: 20px;
}

.vsdk-integration-bar * {
  box-sizing: border-box;
}

.vsdk-guide-card {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  min-width: 0;
  padding-left: 24px;
  overflow: hidden;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 3px 8px #e9f0fb;
  text-decoration: none;
  transition: transform .2s ease, box-shadow .2s ease;
}

.vsdk-guide-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(28, 102, 229, .16);
}

.vsdk-guide-text {
  position: relative;
  z-index: 1;
  margin-right: 20px;
  color: #4f658a;
  font-size: 14px;
  line-height: 24px;
  white-space: nowrap;
}

.vsdk-guide-cta {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 20px 0 28px;
  background: #1c66e5;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  clip-path: polygon(16px 0, 100% 0, 100% 100%, 0 100%);
  white-space: nowrap;
}

.vsdk-guide-cta-label {
  position: relative;
  z-index: 1;
}

.vsdk-guide-chevron {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.vsdk-guide-ribbon {
  position: absolute;
  top: -8px;
  right: 108px;
  z-index: 0;
  width: 18px;
  height: 56px;
  background: linear-gradient(
    180deg,
    rgba(120, 214, 255, .95) 0%,
    rgba(120, 214, 255, .35) 100%
  );
  border-radius: 4px;
  transform: rotate(24deg);
  box-shadow: 2px 3px 6px rgba(208, 244, 255, .9);
  pointer-events: none;
}

.vsdk-feedback-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 40px;
  padding: 0 20px 0 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 3px 8px #e9f0fb;
  color: #1c66e5;
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  text-decoration: none;
  white-space: nowrap;
  transition: transform .2s ease, box-shadow .2s ease;
}

.vsdk-feedback-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(28, 102, 229, .16);
}

.vsdk-feedback-icon {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .vsdk-integration-wrapper {
    width: calc(100% - 32px);
  }

  .vsdk-integration-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .vsdk-guide-card {
    width: 100%;
    justify-content: space-between;
  }

  .vsdk-guide-text {
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 12px;
  }

  .vsdk-guide-ribbon {
    display: none;
  }

  .vsdk-feedback-card {
    width: 100%;
  }
}
</style>
