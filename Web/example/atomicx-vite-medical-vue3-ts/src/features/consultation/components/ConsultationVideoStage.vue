<script setup lang="ts">
import { RoomParticipantView, FillMode, VideoStreamType } from 'tuikit-atomicx-vue3';
import type { ConsultationVideoMember } from '@/features/consultation/types';

withDefaults(
  defineProps<{
    mainMember: ConsultationVideoMember | null;
    thumbnailMembers: ConsultationVideoMember[];
    thumbnailListClass?: string;
    thumbnailCardClass?: string;
  }>(),
  {
    thumbnailListClass: 'top-6 right-6 max-h-[calc(100%-150px)] w-56',
    thumbnailCardClass: 'h-36',
  }
);

const emit = defineEmits<{
  focus: [userId: string];
}>();
</script>

<template>
  <div
    class="absolute inset-0 cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900"
    @click="mainMember && emit('focus', mainMember.userId)"
  >
    <RoomParticipantView
      v-if="mainMember?.participant"
      class="absolute inset-0"
      :participant="mainMember.participant"
      :stream-type="VideoStreamType.Camera"
      :fill-mode="FillMode.Fill"
    />
  </div>

  <div
    v-if="mainMember && !mainMember.videoReady"
    class="absolute inset-0 z-10 flex cursor-pointer items-center justify-center px-6"
    @click="emit('focus', mainMember.userId)"
  >
    <div class="text-center">
      <div
        class="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover shadow-2xl"
      >
        <span class="text-7xl font-semibold text-white">
          {{ mainMember.avatarText }}
        </span>
      </div>
      <h3 class="mb-2 text-3xl font-semibold text-white">
        {{ mainMember.displayName }}
      </h3>
      <span
        class="inline-flex items-center rounded-full bg-medical-success px-3 py-1 text-sm font-semibold text-white"
      >
        {{ mainMember.roleLabel }}摄像头未开启
      </span>
    </div>
  </div>

  <div
    v-if="thumbnailMembers.length"
    :class="[
      'absolute z-20 flex flex-col gap-3 overflow-y-auto',
      thumbnailListClass,
    ]"
  >
    <button
      v-for="member in thumbnailMembers"
      :key="member.userId"
      :class="[
        'relative w-full cursor-pointer overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br from-gray-700 to-gray-800 shadow-xl',
        thumbnailCardClass,
      ]"
      @click="emit('focus', member.userId)"
    >
      <RoomParticipantView
        v-if="member.participant"
        class="absolute inset-0"
        :participant="member.participant"
        :stream-type="VideoStreamType.Camera"
        :fill-mode="FillMode.Fill"
      />
      <div
        v-if="!member.videoReady"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 px-3"
      >
        <div class="text-center w-full">
          <div
            class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-xl font-semibold text-white"
          >
            {{ member.avatarText }}
          </div>
          <p class="truncate text-xs font-semibold leading-none text-white">
            {{ member.displayName }}
          </p>
        </div>
      </div>
      <div
        class="absolute bottom-2 left-2 right-2 rounded-xl bg-black/45 px-3 py-2 text-left backdrop-blur-md"
      >
        <p class="truncate text-sm font-semibold text-white">
          {{ member.displayName }}
        </p>
        <p class="mt-1 text-xs leading-none text-white/65">
          {{ member.roleLabel }}
        </p>
      </div>
    </button>
  </div>
</template>
