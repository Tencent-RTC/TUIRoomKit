<template>
  <svg
    class="edu-stage-empty-art"
    viewBox="0 0 240 160"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <ellipse class="art-shadow" cx="120" cy="148" rx="86" ry="5" />
    <path class="art-line" d="M92 120 80 146M148 120l12 26M120 120v24" />
    <rect class="art-board" x="48" y="20" width="144" height="100" rx="10" />
    <rect class="art-slot" x="64" y="36" width="72" height="50" rx="6" />
    <path class="art-ink" d="M76 72c6-10 12-14 18-6s12 6 18-6" />
    <circle class="art-sun" cx="122" cy="50" r="4" />
    <rect class="art-tray" x="66" y="118" width="108" height="6" rx="3" />
    <rect class="art-pen" x="82" y="111" width="28" height="7" rx="3.5" />
    <rect class="art-pen-cap" x="104" y="111" width="9" height="7" rx="3" />
    <rect class="art-card" x="128" y="58" width="80" height="56" rx="8" />
    <path class="art-line" d="M128 70h80" />
    <circle class="art-brand" cx="136" cy="64" r="2" />
    <circle class="art-sun" cx="142.5" cy="64" r="2" />
    <circle class="art-purple" cx="149" cy="64" r="2" />
    <rect class="art-screen" x="152" y="80" width="32" height="22" rx="3" />
    <path class="art-share" d="M168 97v-10m-4.5 4.5L168 87l4.5 4.5" />
    <path class="art-sun" d="M34 44c0 6 2 8 8 8-6 0-8 2-8 8 0-6-2-8-8-8 6 0 8-2 8-8z" />
    <circle class="art-bubble" cx="212" cy="30" r="6" />
    <path class="art-dash" d="M196 42c-8 4-14 8-18 14" />
    <path class="art-share" d="M28 100v8m-4-4h8" />
  </svg>
</template>

<style scoped lang="scss">
/* Inline rather than an <img>: the strokes and fills follow the theme tokens.
   Fixed accents come from the views-edu illustration. */
.edu-stage-empty-art {
  --art-stroke: color-mix(in srgb, var(--rk-text-primary) 34%, transparent);
  --art-sun: #f5c14a;
  --art-purple: #ba68c8;

  width: min(200px, 36%);
  height: auto;
  stroke-width: 1.6;

  .art-shadow { fill: color-mix(in srgb, var(--rk-text-primary) 6%, transparent); }
  .art-line { stroke: var(--art-stroke); }

  .art-board {
    fill: color-mix(in srgb, var(--rk-text-primary) 6%, var(--rk-bg-surface));
    stroke: var(--art-stroke);
  }

  .art-slot {
    fill: color-mix(in srgb, var(--rk-brand) 6%, transparent);
    stroke: color-mix(in srgb, var(--rk-brand) 55%, transparent);
    stroke-dasharray: 4 4;
  }

  .art-ink {
    stroke: var(--rk-brand);
    stroke-width: 2.4;
  }

  .art-sun { fill: var(--art-sun); }
  .art-brand { fill: var(--rk-brand); }
  .art-purple { fill: var(--art-purple); }

  .art-tray {
    fill: color-mix(in srgb, var(--rk-text-primary) 12%, var(--rk-bg-surface));
    stroke: var(--art-stroke);
  }

  .art-pen { fill: color-mix(in srgb, var(--rk-text-primary) 22%, var(--rk-bg-surface)); }
  .art-pen-cap { fill: var(--rk-brand); }

  .art-card {
    fill: color-mix(in srgb, var(--rk-text-primary) 10%, var(--rk-bg-surface));
    stroke: var(--art-stroke);
  }

  .art-screen { fill: color-mix(in srgb, var(--art-purple) 22%, transparent); }

  .art-share {
    stroke: var(--art-purple);
    stroke-width: 2;
  }

  .art-bubble { fill: color-mix(in srgb, var(--rk-brand) 30%, transparent); }

  .art-dash {
    stroke: var(--art-stroke);
    stroke-dasharray: 2 4;
  }
}
</style>
