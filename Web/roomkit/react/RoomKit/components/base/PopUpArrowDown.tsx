import styles from './PopUpArrowDown.module.scss';

export interface PopUpArrowDownProps {
  onClick?: () => void;
}

export function PopUpArrowDown({ onClick }: PopUpArrowDownProps = {}) {
  return (
    <div className={styles.popUpArrowDown} onClick={onClick}>
      <svg viewBox="0 0 28 7" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="4">
        <path
          d="M2 2L11.0896 4.27239C13.0005 4.75011 14.9995 4.75011 16.9104 4.27239L26 2"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
