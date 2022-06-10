// user system clock may be inaccurate, so we need to adjust the timestamp
// based on the baseTime received from remote server

let baseTime = new Date().getTime();
let offset = 0;

export const setBaseTime = function (time) {
  baseTime = time;
  offset = baseTime - new Date().getTime();
  const base = new Date();
  base.setTime(time);
};

export const getCurrentTime = function () {
  return new Date().getTime() + offset;
};

export const getTimestamp = function () {
  const now = new Date();
  now.setTime(getCurrentTime());
  return now.toLocaleString();
};
