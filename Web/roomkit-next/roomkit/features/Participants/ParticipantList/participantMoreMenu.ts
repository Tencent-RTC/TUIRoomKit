export type ParticipantMoreCommand =
  | 'mute'
  | 'cam'
  | 'rename'
  | 'transfer'
  | 'set-admin'
  | 'revoke-admin'
  | 'chat'
  | 'kick';

export interface ParticipantMoreCommandSpec {
  command: ParticipantMoreCommand;
  separatorBefore?: boolean;
  danger?: boolean;
}

export function resolveParticipantMoreCommands(input: {
  isSelf: boolean;
  canRename: boolean;
  canTransferOwner: boolean;
  canSetAdmin: boolean;
  canRevokeAdmin: boolean;
  canManage: boolean;
}): ParticipantMoreCommandSpec[] {
  if (input.isSelf) {
    return [
      { command: 'mute' },
      { command: 'cam' },
      { command: 'rename' },
    ];
  }

  const items: ParticipantMoreCommandSpec[] = [];
  if (input.canRename) {
    items.push({ command: 'rename' });
  }
  if (input.canTransferOwner) {
    items.push({ command: 'transfer' });
  }
  if (input.canSetAdmin) {
    items.push({ command: 'set-admin' });
  }
  if (input.canRevokeAdmin) {
    items.push({ command: 'revoke-admin' });
  }
  if (input.canManage) {
    items.push(
      { command: 'mute', separatorBefore: true },
      { command: 'cam' },
      { command: 'chat' },
      { command: 'kick', separatorBefore: true, danger: true },
    );
  }
  return items;
}
