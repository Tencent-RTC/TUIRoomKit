import { RoomKitProvider, TUILoading, useI18n } from '../../base';
import './EducationLoadingView.scss';

/**
 * Shown while the education chunk downloads, so it must stay statically imported by
 * `views/index.ts`. Matches the scene's join-loading overlay so the hand-off is seamless.
 */
export function EducationLoadingView() {
  const { t } = useI18n();
  return (
    // Not a command host: the scene view's own provider takes the toasts once it mounts.
    <RoomKitProvider className="education-loading-root" scene="education" command={false}>
      <div className="education-loading">
        <TUILoading variant="card" size="lg" tip={t('RoomEntry.Loading')} />
      </div>
    </RoomKitProvider>
  );
}

export default EducationLoadingView;
