<template>
  <div class="input">
    <input
      @click.stop
      ref="editorInputEle"
      :value="modelValue"
      :type="type"
      class="content-bottom-input"
      :confirm-type="enterkeyhint"
      always-embed="true"
      adjust-position="true"
      @confirm="done"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string;
  placeholder?: string;
  type?: string;
  readonly?: boolean;
  enterkeyhint?: string;
  theme?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  type: 'text',
  enterkeyhint: '',
  modelValue: '',
  theme: '',
});

const emit = defineEmits(['input','done']);

const done = () => {
  emit('done');
}

function handleInput(event: any) {
  const { value } = event.target;
  const trimmedValue = value.trimStart().trimEnd();
  
  if (value !== trimmedValue) {
    event.target.value = trimmedValue;
  }
  emit('input', trimmedValue);
}
</script>

<style>
.input{
  width: 100%;
}
.content-bottom-input {
  color: #676c80;
  width: 100%;
  height: 35px;
  border: none;
  box-sizing: border-box;
  font-family: 'PingFang SC';
  font-style: normal;
  font-weight: 450;
  font-size: 16px;
  line-height: 4vh;
  background: var(--chat-editor-input-color-h5);
  caret-color: var(--caret-color);
  border-radius: 45px;
  resize: none;
  padding-left: 12px;
}
</style>