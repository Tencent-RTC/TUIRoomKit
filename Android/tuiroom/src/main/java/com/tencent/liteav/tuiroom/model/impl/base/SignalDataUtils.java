package com.tencent.liteav.tuiroom.model.impl.base;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.util.Map;

public class SignalDataUtils {
    private static final String TAG = "SignalDataUtils";

    public static SignallingData convert2SignallingData(String data) {
        SignallingData signallingData = new SignallingData();
        Map<String, Object> extraMap;
        try {
            extraMap = new Gson().fromJson(data, Map.class);
            if (extraMap == null) {
                TRTCLogger.e(TAG, "extraMap is null, ignore");
                return signallingData;
            }
            if (extraMap.containsKey(SignallingConstant.KEY_VERSION)) {
                Object version = extraMap.get(SignallingConstant.KEY_VERSION);
                if (version instanceof Double) {
                    signallingData.setVersion(((Double) version).intValue());
                } else {
                    TRTCLogger.e(TAG, "version is not Double, value is :" + version);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_PLATFORM)) {
                Object platform = extraMap.get(SignallingConstant.KEY_PLATFORM);
                if (platform instanceof String) {
                    signallingData.setPlatform((String) platform);
                } else {
                    TRTCLogger.e(TAG, "platform is not string, value is :" + platform);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_BUSINESS_ID)) {
                Object businessId = extraMap.get(SignallingConstant.KEY_BUSINESS_ID);
                if (businessId instanceof String) {
                    signallingData.setBusinessID((String) businessId);
                } else {
                    TRTCLogger.e(TAG, "businessId is not string, value is :" + businessId);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_DATA)) {
                Object dataMapObj = extraMap.get(SignallingConstant.KEY_DATA);
                if (dataMapObj != null && dataMapObj instanceof Map) {
                    Map<String, Object> dataMap = (Map<String, Object>) dataMapObj;
                    SignallingData.DataInfo dataInfo = convert2DataInfo(dataMap);
                    signallingData.setData(dataInfo);
                } else {
                    TRTCLogger.e(TAG, "dataMapObj is not map, value is :" + dataMapObj);
                }
            }

        } catch (JsonSyntaxException e) {
            TRTCLogger.e(TAG, "convert2CallingDataBean json parse error");
        }
        return signallingData;
    }

    private static SignallingData.DataInfo convert2DataInfo(Map<String, Object> dataMap) {
        SignallingData.DataInfo dataInfo = new SignallingData.DataInfo();
        try {
            if (dataMap.containsKey(SignallingConstant.KEY_CMD)) {
                Object cmd = dataMap.get(SignallingConstant.KEY_CMD);
                if (cmd instanceof String) {
                    dataInfo.setCmd((String) cmd);
                } else {
                    TRTCLogger.e(TAG, "cmd is not string, value is :" + cmd);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_ROOM_ID)) {
                Object roomId = dataMap.get(SignallingConstant.KEY_ROOM_ID);
                if (roomId instanceof String) {
                    dataInfo.setRoomId((String) roomId);
                } else {
                    TRTCLogger.e(TAG, "roomId is not string, value is :" + roomId);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_ROOM_ID)) {
                Object roomId = dataMap.get(SignallingConstant.KEY_ROOM_ID);
                if (roomId instanceof String) {
                    dataInfo.setRoomId((String) roomId);
                } else {
                    TRTCLogger.e(TAG, "roomId is not string, value is :" + roomId);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_SENDER_ID)) {
                Object senderId = dataMap.get(SignallingConstant.KEY_SENDER_ID);
                if (senderId instanceof String) {
                    dataInfo.setSenderId((String) senderId);
                } else {
                    TRTCLogger.e(TAG, "senderId is not string, value is :" + senderId);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_RECEIVER_ID)) {
                Object receiverId = dataMap.get(SignallingConstant.KEY_RECEIVER_ID);
                if (receiverId instanceof String) {
                    dataInfo.setReceiverId((String) receiverId);
                } else {
                    TRTCLogger.e(TAG, "receiverId is not string, value is :" + receiverId);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_AGREE)) {
                Object agree = dataMap.get(SignallingConstant.KEY_AGREE);
                if (agree instanceof Boolean) {
                    dataInfo.setAgree((Boolean) agree);
                } else {
                    TRTCLogger.e(TAG, "agree is not boolean, value is :" + agree);
                }
            }

            if (dataMap.containsKey(SignallingConstant.KEY_MUTE)) {
                Object mute = dataMap.get(SignallingConstant.KEY_MUTE);
                if (mute instanceof Boolean) {
                    dataInfo.setMute((Boolean) mute);
                } else {
                    TRTCLogger.e(TAG, "mute is not boolean, value is :" + mute);
                }
            }
        } catch (JsonSyntaxException e) {
            TRTCLogger.e(TAG, "onReceiveNewInvitation JsonSyntaxException:" + e);
        }
        return dataInfo;
    }

    public static GroupNotificationData convert2GroupNotificationData(String notificationJson) {
        GroupNotificationData groupNotificationData = new GroupNotificationData();
        Map<String, Object> extraMap;
        try {
            extraMap = new Gson().fromJson(notificationJson, Map.class);
            if (extraMap == null) {
                TRTCLogger.e(TAG, "extraMap is null, ignore");
                return groupNotificationData;
            }

            if (extraMap.containsKey(SignallingConstant.KEY_VERSION)) {
                Object version = extraMap.get(SignallingConstant.KEY_VERSION);
                if (version instanceof Double) {
                    groupNotificationData.setVersion(((Double) version).intValue());
                } else {
                    TRTCLogger.e(TAG, "version is not Double, value is :" + version);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_SPEECH_MODE)) {
                Object speechMode = extraMap.get(SignallingConstant.KEY_SPEECH_MODE);
                if (speechMode instanceof String) {
                    groupNotificationData.setSpeechMode((String) speechMode);
                } else {
                    TRTCLogger.e(TAG, "speechMode is not String, value is :" + speechMode);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_IS_CHAT_ROOM_MUTED)) {
                Object isChatRoomMuted = extraMap.get(SignallingConstant.KEY_IS_CHAT_ROOM_MUTED);
                if (isChatRoomMuted instanceof Boolean) {
                    groupNotificationData.setChatRoomMuted((Boolean) isChatRoomMuted);
                } else {
                    TRTCLogger.e(TAG, "isChatRoomMuted is not Boolean, value is :" + isChatRoomMuted);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_IS_SPEECH_APPLICATION_FORBIDDEN)) {
                Object isSpeechApplicationForbidden =
                        extraMap.get(SignallingConstant.KEY_IS_SPEECH_APPLICATION_FORBIDDEN);
                if (isSpeechApplicationForbidden instanceof Boolean) {
                    groupNotificationData.setSpeechApplicationForbidden((Boolean) isSpeechApplicationForbidden);
                } else {
                    TRTCLogger.e(TAG, "isSpeechApplicationForbidden is not boolean, value is :"
                            + isSpeechApplicationForbidden);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_IS_ALL_CAMERA_MUTED)) {
                Object isAllCameraMuted =
                        extraMap.get(SignallingConstant.KEY_IS_ALL_CAMERA_MUTED);
                if (isAllCameraMuted instanceof Boolean) {
                    groupNotificationData.setAllCameraMuted((Boolean) isAllCameraMuted);
                } else {
                    TRTCLogger.e(TAG, "isAllCameraMuted is not boolean, value is :" + isAllCameraMuted);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_IS_ALL_MIC_MUTED)) {
                Object isAllMicMuted =
                        extraMap.get(SignallingConstant.KEY_IS_ALL_MIC_MUTED);
                if (isAllMicMuted instanceof Boolean) {
                    groupNotificationData.setAllMicMuted((Boolean) isAllMicMuted);
                } else {
                    TRTCLogger.e(TAG, "isAllMicMuted is not boolean, value is :" + isAllMicMuted);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_IS_CALLING_ROLL)) {
                Object isCallingRoll = extraMap.get(SignallingConstant.KEY_IS_CALLING_ROLL);
                if (isCallingRoll instanceof Boolean) {
                    groupNotificationData.setCallingRoll((Boolean) isCallingRoll);
                } else {
                    TRTCLogger.e(TAG, "isCallingRoll is not boolean, value is :" + isCallingRoll);
                }
            }

            if (extraMap.containsKey(SignallingConstant.KEY_START_TIME)) {
                Object startTime =
                        extraMap.get(SignallingConstant.KEY_START_TIME);
                if (startTime instanceof Double) {
                    groupNotificationData.setStartTime(((Double) startTime).longValue());
                } else {
                    TRTCLogger.e(TAG, "startTime is not long, value is :" + startTime);
                }
            }

        } catch (JsonSyntaxException e) {
            TRTCLogger.e(TAG, "convertToGroupNotificationData json parse error");
        }
        Gson gson = new Gson();
        return gson.fromJson(notificationJson, GroupNotificationData.class);
    }
}
