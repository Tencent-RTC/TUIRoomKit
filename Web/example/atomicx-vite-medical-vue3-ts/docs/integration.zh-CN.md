# 医疗场景源码接入说明

本文面向客户前端团队，说明如何基于当前源码模板完成真实业务数据接入和 UI 定制。

## 1. 接入定位

当前项目是一套医疗音视频问诊前端源码模板。建议按下面职责理解：

| 区域 | 职责 |
| --- | --- |
| 左侧音视频区 | SDK 房间、音视频流、设备控制、呼叫接听 |
| 中间业务区 | 客户 EMR / HIS / PACS / 处方 / 随访等业务页面 |
| 右侧协同区 | 聊天、实时转写、成员管理、会诊邀请 |
| service 适配层 | 将客户接口数据转换为模板内部统一结构 |

医疗业务主数据由客户系统管理，模板只提供音视频链路和前端接入示例。

## 2. 推荐接入顺序

1. 设置 `VITE_MEDICAL_MODE=integration`。
2. 改造 `src/services/adapters/integration/authService.ts`，打通业务入口参数。
3. 改造 `src/services/adapters/integration/userService.ts`，接入医生和患者信息。
4. 改造 `src/services/adapters/integration/appointmentService.ts`，接入预约单和 `roomId`。
5. 将测试 UserSig 逻辑替换为客户服务端签发。
6. 替换 `src/components/MedicalBusinessPanel.vue`，接入客户业务系统。
7. 按客户品牌规范调整页面文案、颜色和布局。

## 3. 入口参数

`integration` 模式默认从 URL 读取启动参数。

医生入口示例：

```text
?role=doctor&userId=doctor_001&appointmentId=APT10001&patientId=patient_001&token=xxxx
```

患者入口示例：

```text
?role=patient&userId=patient_001&appointmentId=APT10001&doctorId=doctor_001&token=xxxx
```

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `role` | 是 | `doctor` 或 `patient` |
| `userId` | 是 | 当前登录用户 ID，需要和 SDK 登录 ID 一致 |
| `appointmentId` | 建议传 | 当前预约单 ID |
| `doctorId` | 建议传 | 当前预约单主治医生 ID，患者入口建议携带 |
| `patientId` | 建议传 | 当前预约单患者 ID，医生入口建议携带 |
| `token` | 建议传 | 客户业务 token |

如果客户通过 SSO、宿主应用或 WebView 注入上下文，可以改造 `getLaunchContext()`。

## 4. 用户数据

用户数据统一由 `userService` 提供，模板内部结构为：

```ts
interface MedicalUser {
  userId: string;
  userName: string;
  avatarUrl: string;
  role: 'doctor' | 'patient';
  title?: string;
  department?: string;
  hospital?: string;
}
```

客户接口字段建议在 `integration/userService.ts` 中转换，不建议页面直接依赖客户后端字段。

## 5. 预约与 roomId

预约数据统一由 `appointmentService` 提供，模板内部结构为：

```ts
interface MedicalAppointment {
  id: string;
  roomId: string;
  doctorId: string;
  patientId: string;
  scheduleStartTime: number;
  scheduleEndTime: number;
  chiefComplaint: string;
  allergyHistory: string;
  medicalHistory: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
}
```

建议客户后端生成并持久化 `roomId`，前端只读取该 `roomId` 并进入对应音视频房间。

注意事项：

- `doctorId`、`patientId` 必须和 SDK 登录 `userId` 一致。
- `scheduleStartTime`、`scheduleEndTime` 使用秒级时间戳。
- 同一预约单的 `roomId` 必须稳定。
- 预约取消、改期、过期状态建议由客户后端统一管理。

## 6. 业务区替换

医生端中间业务区入口：

- `src/components/MedicalBusinessPanel.vue`

正式接入建议设置：

```bash
VITE_MEDICAL_BUSINESS_PANEL_MODE=slot
```

客户可以保留外层容器，只替换内部组件，也可以直接替换整个 `MedicalBusinessPanel.vue`。

## 7. MDT 会诊

当前模板支持主治医生邀请会诊医生加入房间。

权限默认如下：

| 能力 | 主治医生 | 会诊医生 | 患者 |
| --- | --- | --- | --- |
| 邀请会诊医生 | 是 | 否 | 否 |
| 移出成员 | 是 | 否 | 否 |
| 管理患者设备 | 是 | 否 | 否 |
| 查看业务工作区 | 是 | 否 | 否 |
| 聊天 / 转写 | 是 | 是 | 可按客户策略保留 |
| 参与音视频 | 是 | 是 | 是 |

相关逻辑：

- `src/features/consultation/components/ConsultationVideoStage.vue`
- `src/features/consultation/useConsultationParticipants.ts`
- `src/features/consultation/useConsultationPermissions.ts`

## 8. 后端接口与主题定制

更多说明见：

- `docs/backend-contract.zh-CN.md`
- `docs/theme.zh-CN.md`

## 9. demo-only 内容

以下内容仅用于本地演示：

- `src/mock/*` 中的医生、患者和预约数据。
- `PatientSelectDoctorView.vue` 患者选择医生流程。
- 病历、处方、检查资料示例组件。
- 问诊结束页中的处方和结果展示。

正式接入时，请替换为客户业务系统数据或隐藏对应入口。
