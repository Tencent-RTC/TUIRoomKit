import { t } from '../../i18n';
import type { UIConfig } from '../config';
import type { Credentials } from '../types';

function throwInvalidParameter(api: string, reason: string, solution: string, field?: string): never {
  throw new TypeError(`[RoomKit.${api}]${field ? ` ${field}:` : ''} ${reason} ${solution}`);
}

/** Describe types rather than values so credentials never appear in error messages. */
interface ParameterExpectation {
  api: string;
  field: string;
  expected: string;
  actual: unknown;
  expectedType?: string;
}

function assertParameter(
  condition: unknown,
  { api, field, expected, actual, expectedType }: ParameterExpectation,
): asserts condition {
  if (condition) {
    return;
  }
  const actualType = actual === null ? 'null' : Array.isArray(actual) ? 'array' : typeof actual;
  let reason = t('RoomKitDeveloper.InvalidValue', { field, expected });
  if (actual === undefined) {
    reason = t('RoomKitDeveloper.MissingParameter', { field });
  } else if (expectedType && actualType !== expectedType) {
    reason = t('RoomKitDeveloper.InvalidType', { field, expectedType, actualType });
  } else if (typeof actual === 'string' && !actual.trim()) {
    reason = t('RoomKitDeveloper.EmptyString', { field });
  }
  throwInvalidParameter(api, reason, t('RoomKitDeveloper.SetParameter', { field, expected }), field);
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isObject = (value: unknown): value is Record<string, unknown> => Object.prototype.toString.call(value) === '[object Object]';
const isPositiveNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

function assertObjectFields(value: unknown, api: string, field: string, keys: readonly string[]): asserts value is Record<string, unknown> {
  assertParameter(isObject(value), {
    api,
    field,
    expected: t('RoomKitDeveloper.Object'),
    actual: value,
    expectedType: 'object',
  });
  Reflect.ownKeys(value).forEach((key) => {
    const name = field === 'options' || field === 'credentials' ? String(key) : `${field}.${String(key)}`;
    if (typeof key !== 'string' || !keys.includes(key)) {
      throwInvalidParameter(
        api,
        t('RoomKitDeveloper.UnknownParameter', { name }),
        t('RoomKitDeveloper.RemoveParameter', { name, keys: keys.join(', ') }),
        name,
      );
    }
  });
}

type FieldValidator = (value: unknown, api: string, field: string) => void;
type FieldTable = Record<string, FieldValidator>;

/** `expectedKey` names the `RoomKitDeveloper.*` entry describing the accepted value. */
function check(expectedKey: string, accepts: (value: unknown) => boolean, expectedType?: string): FieldValidator {
  return (value, api, field) => assertParameter(accepts(value), {
    api, field, actual: value, expected: t(`RoomKitDeveloper.${expectedKey}`), expectedType,
  });
}

function optional(validate: FieldValidator): FieldValidator {
  return (value, api, field) => {
    if (value !== undefined) {
      validate(value, api, field);
    }
  };
}

function validateFields(value: unknown, fields: FieldTable, api: string, path: string): void {
  assertObjectFields(value, api, path, Object.keys(fields));
  for (const [name, validate] of Object.entries(fields)) {
    const field = path === 'options' || path === 'credentials' ? name : `${path}.${name}`;
    validate(value[name], api, field);
  }
}

const string = check('String', value => typeof value === 'string', 'string');
const boolean = check('Boolean', value => typeof value === 'boolean', 'boolean');
const nonEmptyString = check('NonEmptyString', isNonEmptyString, 'string');
const positiveInteger = check('PositiveInteger', value => typeof value === 'number' && Number.isSafeInteger(value) && value > 0, 'number');
const roomId = check('RoomId', value => isNonEmptyString(value) && /^[a-zA-Z0-9 !#$%&()+\-:;<=>?@[\]^_{|}~,.]{1,64}$/.test(value), 'string');
const password = check('Password', value => typeof value === 'string' && /^\d{6}$/.test(value), 'string');

function isValidCSSValue(value: unknown, property: string): boolean {
  return isNonEmptyString(value) && typeof CSS !== 'undefined' && CSS.supports(property, value);
}

const size = (property: string) => optional(check('Size', value => isPositiveNumber(value) || isValidCSSValue(value, property)));

const credentialsFields: FieldTable = {
  sdkAppId: positiveInteger,
  userId: nonEmptyString,
  userSig: nonEmptyString,
  userName: optional(string),
  avatarUrl: optional(string),
};

const containerFields: FieldTable = {
  appendTo: validateMountTarget,
  width: size('width'),
  height: size('height'),
};

const uiConfigFields: FieldTable = {
  theme: optional((value, api, field) => {
    assertParameter(value === 'light' || value === 'dark', {
      api,
      field,
      expected: t('RoomKitDeveloper.String'),
      actual: value,
      expectedType: 'string',
    });
  }),
  icons: optional(check('Object', isObject, 'object')),
};

const joinFields: FieldTable = {
  roomId,
  password: optional(password),
  container: (value, api, field) => validateFields(value, containerFields, api, field),
};

const createAndJoinFields: FieldTable = {
  ...joinFields,
  roomName: optional(nonEmptyString),
  isAllMicrophoneDisabled: optional(boolean),
  isAllCameraDisabled: optional(boolean),
  isAllScreenShareDisabled: optional(boolean),
  isAllMessageDisabled: optional(boolean),
};

function validateMountTarget(value: unknown, api: string): void {
  if (typeof document === 'undefined') {
    throwInvalidParameter(api, t('RoomKitDeveloper.BrowserOnly'), t('RoomKitDeveloper.BrowserSolution'));
  }
  let mountTarget: unknown = value;
  if (typeof value === 'string') {
    assertParameter(isNonEmptyString(value), {
      api,
      field: 'container.appendTo',
      expected: t('RoomKitDeveloper.Selector'),
      actual: value,
      expectedType: 'string',
    });
    try {
      mountTarget = document.querySelector(value);
    } catch {
      throwInvalidParameter(api, t('RoomKitDeveloper.InvalidSelector'), t('RoomKitDeveloper.SelectorSolution'), 'container.appendTo');
    }
  }
  if (typeof value === 'string' && mountTarget === null) {
    throwInvalidParameter(api, t('RoomKitDeveloper.ElementNotFound'), t('RoomKitDeveloper.ElementNotFoundSolution'), 'container.appendTo');
  }
  if (!(mountTarget instanceof HTMLElement)) {
    throwInvalidParameter(
      api,
      value === undefined ? t('RoomKitDeveloper.MissingContainer') : t('RoomKitDeveloper.InvalidContainer'),
      t('RoomKitDeveloper.ContainerSolution'),
      'container.appendTo',
    );
  }
  if (!mountTarget.isConnected) {
    throwInvalidParameter(api, t('RoomKitDeveloper.DetachedElement'), t('RoomKitDeveloper.DetachedSolution'), 'container.appendTo');
  }
}

export function validateArgumentCount(count: number, max: number, api: string): void {
  if (count <= max) {
    return;
  }
  throwInvalidParameter(
    api,
    max === 0
      ? t('RoomKitDeveloper.NoArguments', { api, count })
      : t('RoomKitDeveloper.TooManyArguments', { api, max, count }),
    max === 0 ? t('RoomKitDeveloper.CallWithoutArguments', { api }) : t('RoomKitDeveloper.KeepArguments', { max }),
  );
}

export function validateCredentials(value: unknown): asserts value is Credentials {
  validateFields(value, credentialsFields, 'getInstance', 'credentials');
}

export function validateJoinOptions(value: unknown, api: 'join' | 'createAndJoin'): void {
  validateFields(value, api === 'join' ? joinFields : createAndJoinFields, api, 'options');
}

export function validateEventListener(event: unknown, handler: unknown, api: 'on' | 'off'): void {
  check('Event', value => value === 'exited', 'string')(event, api, 'event');
  check('Handler', value => typeof value === 'function', 'function')(handler, api, 'handler');
}

export function validateUIConfig(value: unknown): asserts value is UIConfig {
  validateFields(value, uiConfigFields, 'setUIConfig', 'options');
}

