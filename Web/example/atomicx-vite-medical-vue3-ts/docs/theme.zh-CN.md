# 医疗场景主题定制说明

本文说明如何调整医疗问诊模板的品牌色和基础视觉风格。

## 1. 样式入口

```text
src/styles/
  index.css
  tailwind.css
  theme.css
```

- `index.css`：全局样式入口。
- `tailwind.css`：Tailwind CSS 引入入口。
- `theme.css`：主题变量和基础样式。

## 2. 推荐优先修改的变量

主题变量位于 `src/styles/theme.css` 的 `:root` 中。

| 变量 | 用途 |
| --- | --- |
| `--primary` | 主品牌色，默认用于主要按钮、医生端高亮 |
| `--primary-hover` | 主按钮 hover 色 |
| `--medical-success` | 成功、在线、接通等状态 |
| `--medical-warning` | 提醒、待处理状态 |
| `--medical-info` | 信息提示和患者侧辅助色 |
| `--medical-urgent` | 紧急、危险状态 |
| `--background` | 页面背景 |
| `--foreground` | 默认文字颜色 |
| `--border` | 默认边框颜色 |

## 3. 品牌色替换建议

如果客户只需要替换品牌色，优先调整：

```css
:root {
  --primary: #0d9488;
  --primary-hover: #0f766e;
  --medical-success: #10b981;
  --ring: #0d9488;
}
```

`theme.css` 已将医疗状态色注册为 Tailwind 颜色 token，例如 `bg-medical-success`、`from-primary`、`to-primary-hover`。页面中仍存在少量历史 Tailwind 任意颜色类，如果需要完整品牌化，建议继续替换为主题 token 对应的语义化 class。

## 4. 页面文案和品牌名称

常见修改文件：

- `src/views/LoginView.vue`
- `src/views/DoctorDashboardView.vue`
- `src/views/PatientSelectDoctorView.vue`
- `src/views/PatientWaitingView.vue`
- `src/views/PatientConsultationFinishedView.vue`

建议使用客户真实品牌名称替换“示例医疗平台”，并保留“源码模板 / 业务插槽示例”等说明，避免用户误解为完整医疗业务系统。

## 5. 推荐优先调整的基础组件

为了减少页面模板中重复的 Tailwind class，常用交互样式已收敛到以下组件：

```text
src/components/
  MedicalButton.vue
  MedicalAlert.vue
  MedicalConfirmDialog.vue
  LoadingSpinner.vue
```

- `MedicalButton.vue`：统一按钮的 `variant`、`size`、`loading`、`disabled` 行为。客户替换主按钮风格时，优先改这里。
- `MedicalAlert.vue`：统一权限提醒、错误提示、信息提示的视觉样式。
- `MedicalConfirmDialog.vue`：统一危险操作二次确认弹窗，例如医生结束问诊。
- `LoadingSpinner.vue`：统一按钮内 loading 图标。

页面中仍保留 `flex`、`grid`、`gap`、`p-*` 等布局类，方便二开时直接理解结构；品牌色、圆角、按钮状态等视觉规范优先通过上述组件和 `theme.css` 调整。
