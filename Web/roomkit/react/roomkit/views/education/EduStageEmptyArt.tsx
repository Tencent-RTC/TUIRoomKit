import './EduStageEmptyArt.scss';

/* Inline rather than an <img>: the strokes and fills follow the theme tokens. */
export function EduStageEmptyArt() {
  return (
    <svg
      className="edu-stage-empty-art"
      viewBox="0 0 240 160"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse className="art-shadow" cx="120" cy="148" rx="86" ry="5" />
      <path className="art-line" d="M92 120 80 146M148 120l12 26M120 120v24" />
      <rect className="art-board" x="48" y="20" width="144" height="100" rx="10" />
      <rect className="art-slot" x="64" y="36" width="72" height="50" rx="6" />
      <path className="art-ink" d="M76 72c6-10 12-14 18-6s12 6 18-6" />
      <circle className="art-sun" cx="122" cy="50" r="4" />
      <rect className="art-tray" x="66" y="118" width="108" height="6" rx="3" />
      <rect className="art-pen" x="82" y="111" width="28" height="7" rx="3.5" />
      <rect className="art-pen-cap" x="104" y="111" width="9" height="7" rx="3" />
      <rect className="art-card" x="128" y="58" width="80" height="56" rx="8" />
      <path className="art-line" d="M128 70h80" />
      <circle className="art-brand" cx="136" cy="64" r="2" />
      <circle className="art-sun" cx="142.5" cy="64" r="2" />
      <circle className="art-purple" cx="149" cy="64" r="2" />
      <rect className="art-screen" x="152" y="80" width="32" height="22" rx="3" />
      <path className="art-share" d="M168 97v-10m-4.5 4.5L168 87l4.5 4.5" />
      <path className="art-sun" d="M34 44c0 6 2 8 8 8-6 0-8 2-8 8 0-6-2-8-8-8 6 0 8-2 8-8z" />
      <circle className="art-bubble" cx="212" cy="30" r="6" />
      <path className="art-dash" d="M196 42c-8 4-14 8-18 14" />
      <path className="art-share" d="M28 100v8m-4-4h8" />
    </svg>
  );
}

export default EduStageEmptyArt;
