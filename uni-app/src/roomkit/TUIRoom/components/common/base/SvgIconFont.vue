<!--
  * 名称：SvgIcon
  * @param icon String required
  * @param size String | number
  * Usage:
  * Use <svg-icon><chat-icon></chat-icon></svg-icon> in template

  * 使用方式：
  * 在 template 中使用 <svg-icon><chat-icon></chat-icon></svg-icon>
-->
<template>
  <text :style="styleObj" class="uni-icons">{{ unicode }}</text>
</template>

<script lang="ts">
import fontData from '../../../assets/iconfonts/iconfont.js';
import iconUrl from '../../../assets/iconfonts/iconfont.ttf';
const domModule = weex.requireModule('dom');
domModule.addRule('fontFace', {
  'fontFamily': "uniicons",
  'src': "url('" + iconUrl + "')",
});

export default {
  name: 'SvgIconBack',
  props: {
    icon: {
      type: String,
      default: '',
    },
    size: {
      type: [String, Number],
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    customStyle: {
      type: Object,
      default: {},
    },
  },
  data() {
    return {
      icons: fontData,
    };
  },
  computed: {
    unicode() {
      let icon = this.icons?.glyphs?.find(v => v.name === this.icon)
      if (icon) {
        return String.fromCharCode(icon.unicode_decimal);
      }
      return '';
    },
    styleObj() {
      const styleObj = {};
      if (this.size) {
        styleObj['fontSize'] = `${Number(this.size)}px`;
        styleObj['lineHeight'] = `${Number(this.size)}px`;
      }
      if (this.color) {
        styleObj['color'] = this.color;
      }
      return styleObj;
    },
  },
};
</script>

<style lang="scss" scoped>
.uni-icons {
  font-family: uniicons;
  text-decoration: none;
  text-align: center;
}
</style>
