import {
  validateArgumentCount,
  validateCredentials,
  validateEventListener,
  validateJoinOptions,
  validateUIConfig,
} from './parameters';

type RoomKitMethod = 'getInstance' | 'destroyInstance' | 'createAndJoin' | 'join' | 'leave' | 'end' | 'on' | 'off' | 'setUIConfig';

const parameterValidators: Record<RoomKitMethod, (args: unknown[]) => void> = {
  getInstance: (args) => {
    validateArgumentCount(args.length, 1, 'getInstance');
    validateCredentials(args[0]);
  },
  destroyInstance: args => validateArgumentCount(args.length, 0, 'destroyInstance'),
  createAndJoin: (args) => {
    validateArgumentCount(args.length, 1, 'createAndJoin');
    validateJoinOptions(args[0], 'createAndJoin');
  },
  join: (args) => {
    validateArgumentCount(args.length, 1, 'join');
    validateJoinOptions(args[0], 'join');
  },
  leave: args => validateArgumentCount(args.length, 0, 'leave'),
  end: args => validateArgumentCount(args.length, 0, 'end'),
  on: (args) => {
    validateArgumentCount(args.length, 2, 'on');
    validateEventListener(args[0], args[1], 'on');
  },
  off: (args) => {
    validateArgumentCount(args.length, 2, 'off');
    validateEventListener(args[0], args[1], 'off');
  },
  setUIConfig: (args) => {
    validateArgumentCount(args.length, 1, 'setUIConfig');
    validateUIConfig(args[0]);
  },
};

export function validateParameters(api: RoomKitMethod): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    const method = descriptor.value as (...args: unknown[]) => unknown;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      parameterValidators[api](args);
      return method.apply(this, args);
    } as typeof descriptor.value;
  };
}
