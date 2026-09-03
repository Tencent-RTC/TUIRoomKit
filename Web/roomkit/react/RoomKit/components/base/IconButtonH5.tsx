import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import classNames from 'classnames';
import styles from './IconButtonH5.module.scss';

export interface IconButtonH5Props {
  /** Title text rendered below the icon. */
  title: string;
  /** When true, disables interactions and lowers opacity. */
  disabled?: boolean;
  /** Icon element rendered above the title. */
  children?: ReactNode;
  /** Custom style overrides applied to the wrapper. */
  customStyle?: CSSProperties;
  /** Click handler forwarded to the wrapper. */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export function IconButtonH5({
  title,
  disabled = false,
  children,
  customStyle,
  onClick,
}: IconButtonH5Props) {
  return (
    <div
      className={classNames(styles.iconButtonH5, {
        [styles.disabled]: disabled,
      })}
      style={customStyle}
      onClick={onClick}
    >
      {children}
      {title && <span className={styles.title}>{title}</span>}
    </div>
  );
}
