import type { CSSProperties } from 'react';
import { TUICheckbox, TUIInput } from '../../../base';
import { useI18n } from '../../../i18n';
import {
  PASSWORD_LENGTH,
  isPasswordComplete,
  randomPassword,
  sanitizePassword,
} from './scheduleForm';
import './SchedulePolicyFields.scss';

export interface SchedulePolicyFieldsProps {
  passwordProtected: boolean;
  password: string;
  passwordVisible: boolean;
  passwordError: boolean;
  isAllMicrophoneDisabled: boolean;
  isAllCameraDisabled: boolean;
  className?: string;
  style?: CSSProperties;
  onUpdatePasswordProtected?: (value: boolean) => void;
  onUpdatePassword?: (value: string) => void;
  onUpdatePasswordVisible?: (value: boolean) => void;
  onUpdatePasswordError?: (value: boolean) => void;
  onUpdateIsAllMicrophoneDisabled?: (value: boolean) => void;
  onUpdateIsAllCameraDisabled?: (value: boolean) => void;
}

export function SchedulePolicyFields(props: SchedulePolicyFieldsProps) {
  const {
    passwordProtected,
    password,
    passwordError,
    isAllMicrophoneDisabled,
    isAllCameraDisabled,
    className,
    style,
    onUpdatePasswordProtected,
    onUpdatePassword,
    onUpdatePasswordVisible,
    onUpdatePasswordError,
    onUpdateIsAllMicrophoneDisabled,
    onUpdateIsAllCameraDisabled,
  } = props;
  const { t } = useI18n();

  function togglePassword() {
    const next = !passwordProtected;
    onUpdatePasswordProtected?.(next);
    onUpdatePasswordError?.(false);
    if (next && !password) {
      onUpdatePassword?.(randomPassword());
    }
    if (!next) {
      onUpdatePasswordVisible?.(false);
    }
  }

  function onPasswordInput(value: string | number | null) {
    const next = sanitizePassword(String(value ?? ''));
    onUpdatePassword?.(next);
    if (isPasswordComplete(next)) {
      onUpdatePasswordError?.(false);
    }
  }

  return (
    <div
      className={['sch-policy', className ?? ''].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="sch-field sch-field-opts">
        <span className="sch-label">{t('Schedule.Security')}</span>
        <div className="sch-check-col">
          <TUICheckbox
            modelValue={passwordProtected}
            onChange={togglePassword}
          >
            {t('Schedule.RoomPassword')}
          </TUICheckbox>
          {passwordProtected && (
            <div className="sch-pw-wrap">
              <TUIInput
                className="sch-pw-field"
                modelValue={password}
                type="password"
                showPassword
                status={passwordError ? 'error' : 'default'}
                maxlength={PASSWORD_LENGTH}
                placeholder={t('Schedule.PasswordPlaceholder', { length: PASSWORD_LENGTH })}
                onUpdateModelValue={onPasswordInput}
              />
              {passwordError && (
                <div className="sch-pw-hint is-on">
                  {t('Schedule.Error.Password', { length: PASSWORD_LENGTH })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sch-field sch-field-opts">
        <span className="sch-label">{t('Schedule.Members')}</span>
        <div className="sch-check-col">
          <TUICheckbox
            modelValue={isAllMicrophoneDisabled}
            onUpdateModelValue={value => onUpdateIsAllMicrophoneDisabled?.(value)}
          >
            {t('Schedule.OptionMuteAll')}
          </TUICheckbox>
          <TUICheckbox
            modelValue={isAllCameraDisabled}
            onUpdateModelValue={value => onUpdateIsAllCameraDisabled?.(value)}
          >
            {t('Schedule.MuteVideo')}
          </TUICheckbox>
        </div>
      </div>
    </div>
  );
}

export default SchedulePolicyFields;
