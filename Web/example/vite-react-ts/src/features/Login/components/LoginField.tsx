import type { ReactNode } from 'react';
import './LoginField.scss';

interface LoginFieldProps {
  label: string;
  error?: string;
  children?: ReactNode;
}

export function LoginField({ label, error, children }: LoginFieldProps) {
  return (
    <label className="login-field">
      <span className="login-field-label">{label}</span>
      {children}
      {error && <span className="login-field-error">{error}</span>}
    </label>
  );
}

export default LoginField;
