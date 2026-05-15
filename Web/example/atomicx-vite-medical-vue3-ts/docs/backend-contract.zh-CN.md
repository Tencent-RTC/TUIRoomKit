# 后端接口契约建议

本文说明客户业务系统接入医疗音视频模板时，建议提供的最小后端接口。字段可按客户实际系统调整，但建议在 `src/services/adapters/integration/` 中转换为模板内部统一结构。

## 1. 登录签名接口

前端拿到客户业务 token 后，请求客户服务端签发音视频登录信息。

```http
POST /api/rtc/signature
Authorization: Bearer <customer-token>
Content-Type: application/json
```

请求：

```json
{
  "userId": "doctor_001"
}
```

响应：

```json
{
  "sdkAppId": 0,
  "userId": "doctor_001",
  "userSig": "server-generated-usersig",
  "expireTime": 604800
}
```

说明：

- `userId` 必须和医生、患者、会诊医生在业务系统中的身份保持一致。
- `userSig` 必须由客户服务端生成，不建议在前端生成。

## 2. 当前用户接口

```http
GET /api/medical/users/me
Authorization: Bearer <customer-token>
```

响应：

```json
{
  "userId": "doctor_001",
  "userName": "李医生",
  "avatarUrl": "",
  "role": "doctor",
  "title": "主任医师",
  "department": "心内科",
  "hospital": "示例医院"
}
```

## 3. 预约详情接口

```http
GET /api/medical/appointments/{appointmentId}
Authorization: Bearer <customer-token>
```

响应：

```json
{
  "id": "APT10001",
  "roomId": "medical-room-APT10001",
  "doctorId": "doctor_001",
  "patientId": "patient_001",
  "consultantDoctorIds": ["doctor_002"],
  "scheduleStartTime": 1760000000,
  "scheduleEndTime": 1760001800,
  "chiefComplaint": "咳嗽 3 天",
  "allergyHistory": "无",
  "medicalHistory": "无重大疾病史",
  "patientAge": 35,
  "patientGender": "男",
  "patientPhone": "138****5678"
}
```

说明：

- `roomId` 建议由客户后端生成并持久化。
- 时间戳建议统一使用秒。
- `doctorId`、`patientId`、`consultantDoctorIds` 应和音视频登录 `userId` 一致。

## 4. 医生今日预约列表

```http
GET /api/medical/doctors/{doctorId}/appointments?date=2026-05-13
Authorization: Bearer <customer-token>
```

响应：

```json
{
  "list": [
    {
      "id": "APT10001",
      "roomId": "medical-room-APT10001",
      "doctorId": "doctor_001",
      "patientId": "patient_001",
      "scheduleStartTime": 1760000000,
      "scheduleEndTime": 1760001800,
      "chiefComplaint": "咳嗽 3 天",
      "allergyHistory": "无",
      "medicalHistory": "无重大疾病史",
      "patientAge": 35,
      "patientGender": "男",
      "patientPhone": "138****5678"
    }
  ]
}
```

## 5. 患者预约列表

```http
GET /api/medical/patients/{patientId}/appointments
Authorization: Bearer <customer-token>
```

响应结构同医生预约列表。

## 6. 会诊医生列表

```http
GET /api/medical/doctors?keyword=心内科
Authorization: Bearer <customer-token>
```

响应：

```json
{
  "list": [
    {
      "userId": "doctor_002",
      "userName": "王医生",
      "avatarUrl": "",
      "role": "doctor",
      "title": "副主任医师",
      "department": "心内科",
      "hospital": "示例医院"
    }
  ]
}
```

## 7. 接入建议

- 页面层不要直接请求客户接口。
- 在 `src/services/adapters/integration/` 中完成接口请求和字段映射。
- 客户接口返回字段可以不同，但最终应转换为 `MedicalUser` 和 `MedicalAppointment`。
- 预约取消、改期、过期等状态建议由客户后端统一管理，前端只展示接口结果。
