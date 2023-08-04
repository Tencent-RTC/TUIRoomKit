/*
 * @Description: 用户，房间管理后台接口
 * @Date: 2021-11-05 15:44:57
 * @LastEditTime: 2021-12-16 11:01:07
 */
import axios, { AxiosInstance } from 'axios';
import Cookies from '@/TUIRoom/utils/common/cookieStorage.js';
import router from '@/router';
import { isInnerScene } from '@/TUIRoom/utils/constants';


const premixUrl = 'https://demos.trtc.tencent-cloud.com/prod/';
const category = 'TUIRoom';

const http: AxiosInstance = axios.create({
  baseURL: premixUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 在发送请求之前数据中写入 apaasAppId 数据
// apaasAppId: 1017658747， 对应 sdkAppId: 1400704311;
if (isInnerScene) {
  http.interceptors.request.use((config: any) => {
    const param = config;
    Object.assign(param.params, { apaasAppId: '1017658747' });
    return param;
  });
}
// 拦截response, 只返回data
// to-do:建群失败跳到登录页
http.interceptors.response.use((response:any) => {
  const { errorCode } = response.data;
  if (errorCode === 203 || errorCode === 204) {
    Cookies.remove('tuiRoom-token');
    router.replace({ path: 'login' });
  }
  return response;
}, (error: any) => Promise.reject(error));

/**
 * 用户图形验证码通过后，获取短信验证码
 * @param {string} areaCode 用户手机号区号
 * @param {string} phoneNumber 用户手机号码
 * @param {string} mailAddress 用户邮箱地址
 * @param {string} randstr 图形验证码成功后返回的随机串
 * @param {string} ticket 图形验证码成功后返回的票据
 */
interface GetVerifyCodeProps {
  appId: string,
  ticket: string,
  randstr: string,
  areaCode: string,
  phoneNumber: string,
  mailAddress: string,
}
export function getVerifyCode(data: GetVerifyCodeProps) {
  const { areaCode, phoneNumber } = data;
  const params = {
    appId: data.appId,
    ticket: data.ticket,
    randstr: data.randstr,
    phone: areaCode + phoneNumber,
    email: data.mailAddress,
  };
  return http.get('/base/v1/auth_users/user_verify_by_picture', { params });
}

/**
 * 验证码登录
 * @param {object}
 * @param {string} object.areaCode 用户手机号区号
 * @param {string} object.phoneNumber 用户手机号码
 * @param {string} object.mailAddress 用户邮箱地址
 * @param {string} object.sessionId sessionId
 * @param {strign} object.verifyCode 验证码
 */
interface VerifyCodeLoginProps {
  areaCode: string,
  phoneNumber: string,
  mailAddress: string,
  sessionId: string,
  verifyCode: string,
}
export function verifyCodeLogin(data: VerifyCodeLoginProps) {
  const { areaCode, phoneNumber } = data;
  const params = {
    sessionId: data.sessionId,
    phone: areaCode + phoneNumber,
    email: data.mailAddress,
    code: data.verifyCode,
  };
  return http.get('/base/v1/auth_users/user_login_code', { params });
}

/**
 * token登录
 * @param {string} token
 */
interface TokenLoginProps {
  userId: string;
  token: string;
}
export function tokenLogin(data: TokenLoginProps) {
  const params = {
    apaasUserId: data.userId,
    token: data.token,
  };
  return http.get('/base/v1/auth_users/user_login_token', { params });
}

/**
 * 用户退出登录
 * @param {string} userId
 * @returns {string} token
 */
interface LogoutProps {
  userId: string;
  token: string;
}
export function logout(data: LogoutProps) {
  const params = {
    userId: data.userId,
    token: data.token,
  };
  return http.get('/base/v1/auth_users/user_logout', { params });
}

/**
 * 生成roomId
 * @param {string} userId 用户id
 * @param {string} token 用户token
 * @param {string} title 直播间名称
 */
interface GenerateRoomIdProps {
  userId: string;
  token: string;
  title?: string;
}
export function generateRoomId(data: GenerateRoomIdProps) {
  const params = {
    userId: data.userId,
    token: data.token,
    category,
    title: data.title,
    apaasUserId: data.userId,
  };
  return http.get('/base/v1/rooms/generate_roomid', { params });
}

/**
 * 更新房间信息
 * @param {string} sdkAppId
 * @param {string} userId
 * @param {string} token
 * @param {string} roomId
 * @param {string} title
 * @param {string} cover
 */
interface UpdateRoomInfoProps {
  sdkAppId: string | number,
  userId: string,
  token: string,
  roomId: string,
  title: string,
  cover: string,
}
export function updateRoomInfo(data: UpdateRoomInfoProps) {
  const params = {
    appId: `${data.sdkAppId}`,
    userId: data.userId,
    token: data.token,
    roomId: data.roomId,
    category,
    title: data.title,
    cover: data.cover,
  };
  return http.get('/base/v1/rooms/update_room', { params });
}
/**
 * 获取用户信息
 * @param {string} userId
 * @param {string} token
 */
export function getUserInfo(data: {
  userId: string,
  token: string,
}) {
  const params = {
    userId: data.userId,
    token: data.token,
  };
  return http.get('/base/v1/auth_users/user_query', { params });
}

/**
 * 更新用户信息
 * @param {string} userId
 * @param {string} token
 * @param {string} userName
 */
export function updateUserName(data: {
  userId: string,
  token: string,
  userName: string
}) {
  const params = {
    userId: data.userId,
    token: data.token,
    name: data.userName,
  };
  return http.get('/base/v1/auth_users/user_update', { params });
}

/**
 * 进入房间
 * @param {string} sdkAppId 应用id信息
 * @param {string} userId 用户id
 * @param {string} token 用户token信息
 * @param {string} roomId 房间id信息
 * @param {string} role 用户角色
 * @param {string} title 直播间标题
 */
interface EnterRoomProps {
  sdkAppId: string | number,
  userId: string,
  token: string,
  roomId: string,
  role?: string,
  title?: string,
}
export function enterRoom(data: EnterRoomProps) {
  const params = {
    appId: `${data.sdkAppId}`,
    userId: data.userId,
    token: data.token,
    roomId: data.roomId,
    category,
    role: data.role,
    title: data.title,
    apaasUserId: data.userId,
  };
  return http.get('/base/v1/rooms/enter_room', { params });
}

/**
 * 房间保活
 * @param {string} userId 用户Id
 * @param {string} token 用户token
 */
interface KeepLiveProps {
  userId: string;
  token: string;
}
export function keepLive(data: KeepLiveProps) {
  const params = {
    userId: data.userId,
    token: data.token,
  };
  return http.get('/base/v1/auth_users/user_keepalive', { params });
}

/**
 * 获取房间列表
 * @param {string} sdkAppId 应用信息sdkAppId
 * @param {string} userId 用户信息
 * @param {string} token 用户token信息
 */
interface GetRoomListProps {
  sdkAppId: string | number,
  userId: string,
  token: string,
}
export function getRoomList(data: GetRoomListProps) {
  const params = {
    appId: `${data.sdkAppId}`,
    userId: data.userId,
    token: data.token,
    category,
  };
  return http.get('/base/v1/rooms/query_room', { params });
}

/**
 * 获取房间详细信息
 * @param {string} userId 用户userId信息
 * @param {string} token 用户token信息
 * @param {string} roomId 直播间信息
 */
interface GetRoomDetailProps {
  userId: string;
  token: string;
  roomId: string;
}
export function getRoomDetail(data: GetRoomDetailProps) {
  const params = {
    userId: data.userId,
    token: data.token,
    roomId: data.roomId,
  };
  return http.get('/base/v1/rooms/room_detail', { params });
}
/**
 * 获取临时账号和userSig
* @param {string} userId 用户userId信息
 * @param {string} token 用户token信息
 * @param {string} doctorUserId 指定的临时userId
 * @returns
 */
interface GetTempAuthProps {
  userId: string;
  token: string;
  givenUserId: string;
}
export function getTempAuth(data: GetTempAuthProps) {
  const params = {
    userId: data.userId,
    token: data.token,
    doctorUserId: data.givenUserId,
  };
  return http.get('/base/v1/auth_users/user_doctor_auth', { params });
}

/**
 * 退出房间
 * @param {string} userId 用户userId信息
 * @param {string} token 用户token信息
 * @param {string} roomId 直播间信息
 */
interface LeaveRoomProps {
  userId: string,
  token: string,
  roomId: string,
}
export function leaveRoom(data: LeaveRoomProps) {
  const params = {
    userId: data.userId,
    token: data.token,
    roomId: data.roomId,
  };
  return http.get('/base/v1/rooms/leave_room', { params });
}

/**
 * 销毁直播间
 * @param {string} userId
 * @param {string} token
 * @param {string} roomId
 */
interface DestroyRoomProps {
  userId: string,
  token: string,
  roomId: string,
}
export function destroyRoom(data: DestroyRoomProps) {
  const params = {
    userId: data.userId,
    token: data.token,
    roomId: data.roomId,
  };
  return http.get('/base/v1/rooms/destroy_room', { params });
}
