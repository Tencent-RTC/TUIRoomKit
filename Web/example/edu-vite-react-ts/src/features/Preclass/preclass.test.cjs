const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the migrated TypeScript directly without loading browser-only SDKs.
function loadModule(file, dependencies) {
  const source = readFileSync(resolve(__dirname, file), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    Date, Math, Set, Promise, setTimeout, clearTimeout,
    console: { error() {} },
    window: { location: { origin: 'https://example.test', pathname: '/education/' } },
  }, { filename: file });
  return exports;
}

const wording = {
  language: 'en-US',
  t: (key, values) => `${key}${values ? `:${values.count}` : ''}`,
};
const time = loadModule('PreclassPC/schedule/scheduleTime.ts', {
  '@tencentcloud/roomkit-web-react': { i18n: wording, t: wording.t },
});
const modes = loadModule('classMode.ts', {});
const errorCodes = { ERR_ROOM_ID_NOT_EXIST: 1, ERR_ROOM_ID_OCCUPIED: 2, ERR_SDK_NOT_INITIALIZED: 3 };

function createSchedule(roomState, userId = 'teacher') {
  const schedule = loadModule('PreclassPC/schedule/useClassSchedule.ts', {
    react: {
      useEffect() {},
      useRef: value => ({ current: value }),
      useState: value => [typeof value === 'function' ? value() : value, () => {}],
    },
    '@tencentcloud/tuiroom-engine-js': { TUIErrorCode: errorCodes },
    'tuikit-atomicx-react/room': {
      LoginStatus: { LOGINED: 'logged-in' },
      useLoginState: () => ({ loginStatus: 'logged-in', loginUserInfo: { userId } }),
      useRoomState: () => ({ scheduledRoomList: [], ...roomState }),
    },
    '../../classMode': modes,
  });
  return { ...schedule.useClassSchedule(), classLink: schedule.classLink };
}
const booking = {
  title: 'Math', start: 2000000000, end: 2000002700,
  attendees: [{ userId: 'student', userName: 'Student' }],
  muteAll: true, classMode: 'small',
};

test('time conversion round-trips UTC offsets including half-hour zones', () => {
  for (const zone of ['UTC-12:00', 'UTC+00:00', 'UTC+05:30', 'UTC+08:00']) {
    const seconds = time.toEpochSeconds('2026-12-31', '23:45', zone);
    assert.deepEqual({ ...time.fromEpochSeconds(seconds, zone) }, { dateKey: '2026-12-31', clock: '23:45' });
  }
});

test('next slot is strictly future and rolls over midnight', () => {
  const now = Date.UTC(2026, 11, 31, 23, 45);
  assert.deepEqual({ ...time.nextSlot(now, 'UTC+00:00') }, { dateKey: '2027-01-01', clock: '00:00' });
  assert.equal(time.clockOptions().length, 96);
  assert.equal(time.normalizeDuration(44), 45);
  assert.equal(time.normalizeDuration(120), 120);
});

test('formatting reads changed language without calling a React hook', () => {
  wording.language = 'zh-CN';
  assert.equal(time.formatDate('2026-11-16'), '2026年11月16日');
  wording.language = 'en-US';
  assert.equal(time.formatMonth(2026, 11), 'November 2026');
});

test('mode markers and member caps match education scheduling', () => {
  assert.equal(modes.getClassMode({ roomId: 'edu_small_123456' }), 'small');
  assert.equal(modes.getClassMode({ roomId: 'legacy-id' }), 'oneOnOne');
  assert.equal(modes.CLASS_MODES.oneOnOne.maxMembers, 1);
  assert.equal(modes.CLASS_MODES.small.maxMembers, 6);
  assert.equal(modes.CLASS_MODES.large.isAvailable, false);
});

test('booking retries occupied room ids and forwards the mute/member policy', async () => {
  const calls = [];
  let attempts = 0;
  const schedule = createSchedule({
    getRoomInfo: async () => { throw { code: errorCodes.ERR_ROOM_ID_NOT_EXIST }; },
    scheduleRoom: async request => {
      attempts += 1;
      if (attempts === 1) throw { code: errorCodes.ERR_ROOM_ID_OCCUPIED };
      calls.push(request);
    },
  });
  const outcome = await schedule.book(booking);
  assert.match(outcome.roomId, /^edu_small_\d{6}$/);
  assert.equal(attempts, 2);
  assert.equal(calls[0].options.isAllMicrophoneDisabled, true);
  assert.deepEqual(Array.from(calls[0].options.scheduleAttendees), ['student']);
  assert.equal(schedule.classLink(), 'https://example.test/education/#/home');
});

test('booking caps room-id probes rather than overwriting existing classes', async () => {
  let probes = 0;
  const schedule = createSchedule({ getRoomInfo: async () => { probes += 1; } });
  assert.equal((await schedule.book(booking)).failure, 'id-exhausted');
  assert.equal(probes, 5);
});

test('editing paginates members and sends only added and removed ids', async () => {
  const calls = [];
  const schedule = createSchedule({
    getScheduledAttendees: async ({ cursor }) => !cursor
      ? { attendees: [{ userId: 'old', userName: '' }], cursor: 'next' }
      : { attendees: [{ userId: 'kept', userName: 'Kept' }], cursor: '' },
    updateScheduledRoom: async request => calls.push(['update', request]),
    addScheduledAttendees: async request => calls.push(['add', request]),
    removeScheduledAttendees: async request => calls.push(['remove', request]),
  });
  const outcome = await schedule.update('edu_small_1', {
    ...booking, attendees: [{ userId: 'kept', userName: 'Kept' }, ...booking.attendees],
  });
  assert.equal(outcome.roomId, 'edu_small_1');
  assert.equal(calls[0][0], 'update');
  assert.equal('isAllMicrophoneDisabled' in calls[0][1].options, false);
  assert.deepEqual(Array.from(calls[1][1].userIdList), ['student']);
  assert.deepEqual(Array.from(calls[2][1].userIdList), ['old']);
});

test('course list drops ended rooms, sorts start time, and resolves ownership', () => {
  const now = Math.floor(Date.now() / 1000);
  const schedule = createSchedule({ scheduledRoomList: [
    { roomId: 'later', scheduledStartTime: now + 120, scheduledEndTime: now + 180 },
    { roomId: 'ended', scheduledStartTime: now - 120, scheduledEndTime: now - 60 },
    { roomId: 'live', scheduledStartTime: now - 60, scheduledEndTime: now + 60, roomOwner: { userId: 'teacher' } },
  ] });
  assert.deepEqual(Array.from(schedule.courses, course => course.roomId), ['live', 'later']);
  assert.equal(schedule.courses[0].isMine, true);
  assert.equal(schedule.courses[0].status, 'live');
});
