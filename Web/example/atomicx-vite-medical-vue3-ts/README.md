# Medical Consultation UIKit Demo

医疗场景化音视频源码示例，基于 Vue 3、Vite 和音视频 UIKit 构建。该项目展示如何把稳定的实时音视频能力嵌入互联网医院、远程问诊、复诊随访和 MDT 多学科会诊等医疗业务流程。

> 本项目是医疗问诊前端源码模板，不是完整 HIS / EMR / 处方 / 支付 / 医保系统。示例中的病历、处方、检查资料和医生数据仅用于展示业务系统接入方式。

## 能力概览

- 医生端问诊工作台：音视频主画面、业务插槽、聊天、实时转写、成员管理。
- 患者端问诊链路：选择医生、候诊、接听呼叫、视频问诊、问诊结束页。
- 即时呼叫：医生在工作台发起呼叫，患者在候诊页接听进入房间。
- MDT 会诊：主治医生可邀请会诊医生，医生端和患者端均支持多人视频缩略流。
- 业务插槽：中间区域可替换为客户 EMR / HIS / PACS / 处方 / 随访页面。
- 双模式数据源：`mock` 用于本地演示，`integration` 用于客户业务系统接入。

## 快速开始

当前 demo 位于 monorepo 中，请在仓库根目录运行：

```bash
pnpm -C conference/demos/web-vite-medical-vue3 dev
```

构建验证：

```bash
pnpm -C conference/demos/web-vite-medical-vue3 build
```

## 运行模式

通过环境变量切换数据和业务区展示模式：

```bash
VITE_MEDICAL_MODE=mock
VITE_MEDICAL_BUSINESS_PANEL_MODE=demo
VITE_MEDICAL_BUSINESS_SLOT_TITLE="EMR / HIS / PACS 业务插槽"
```

| 配置 | 可选值 | 说明 |
| --- | --- | --- |
| `VITE_MEDICAL_MODE` | `mock` | 使用内置演示账号和预约数据 |
| `VITE_MEDICAL_MODE` | `integration` | 从客户业务系统入口读取上下文 |
| `VITE_MEDICAL_BUSINESS_PANEL_MODE` | `demo` | 展示病历、处方、资料示例 |
| `VITE_MEDICAL_BUSINESS_PANEL_MODE` | `slot` | 展示业务插槽提示，便于客户替换 |

正式接入建议：

```bash
VITE_MEDICAL_MODE=integration
VITE_MEDICAL_BUSINESS_PANEL_MODE=slot
```

## 项目结构

```text
src/
  config/                  # 运行配置和 SDK 演示配置
  mock/                    # 本地演示数据
  services/adapters/       # mock / integration 数据适配层
  features/consultation/   # 会诊成员、角色、权限等通用逻辑
  views/                   # 页面级组件
  components/              # 医疗业务区与协同面板组件
  utils/                   # session、导航、格式化等工具
  styles/                  # 样式入口和主题变量
```

## 关键代码

| 文件 | 说明 |
| --- | --- |
| `src/views/DoctorConsultationView.vue` | 医生问诊工作台 |
| `src/views/PatientConsultationView.vue` | 患者视频问诊页 |
| `src/components/MedicalBusinessPanel.vue` | 医生端中间业务插槽 |
| `src/components/ConsultationManagePanel.vue` | 聊天、转写、成员管理、会诊邀请 |
| `src/features/consultation/components/ConsultationVideoStage.vue` | 多人主画面与缩略流布局 |
| `src/features/consultation/useConsultationParticipants.ts` | 多人视频成员列表和主画面聚焦逻辑 |
| `src/features/consultation/useConsultationPermissions.ts` | 主治医生 / 会诊医生权限控制 |
| `src/services/adapters/types.ts` | 模板内部统一数据结构 |
| `src/services/adapters/integration/*` | 客户业务系统接入示例骨架 |

## 接入文档

详细接入说明见：

- [中文接入说明](./docs/integration.zh-CN.md)
- [后端接口契约建议](./docs/backend-contract.zh-CN.md)
- [主题定制说明](./docs/theme.zh-CN.md)

## 场景边界

该 demo 聚焦音视频产品在医疗业务中的集成方式：

- 预约、挂号、病历、处方、检查资料等医疗主数据由客户业务系统负责。
- `roomId` 建议由客户后端生成并持久化，前端只消费接口返回结果。
- UserSig 建议由客户服务端签发，前端只使用服务端返回的登录信息。
- mock 数据、示例表单和患者选医生页面仅用于演示，不代表完整医疗业务系统。

## 常见改造点

- 替换 `src/services/adapters/integration/*`，接入客户登录、用户和预约接口。
- 替换 `MedicalBusinessPanel.vue`，接入客户 EMR / HIS / PACS 页面。
- 按客户产品策略决定患者端是否展示聊天、转写和会诊医生信息。
- 按品牌规范调整 `src/styles/theme.css` 和页面中的主题色。

## License

请根据最终开源策略补充 License。
