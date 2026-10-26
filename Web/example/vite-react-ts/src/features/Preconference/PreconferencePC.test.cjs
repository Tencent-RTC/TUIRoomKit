const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');

// React keeps the styles in a sibling scss file instead of an SFC style block.
const styleFile = resolve(__dirname, 'PreconferencePC/PreconferencePC.scss');

test('matches the design content layout dimensions', () => {
  const view = readFileSync(styleFile, 'utf8');

  assert.match(view, /padding: clamp\(16px, 5vh, 76px\) 40px/);
  assert.match(view, /grid-template-columns: minmax\(0, 1\.35fr\) minmax\(380px, 1fr\)/);
  assert.match(view, /width: 75%/);
  assert.match(view, /height: 95%/);
  assert.match(view, /min-height: 520px/);
  assert.match(view, /flex: 0 0 auto/);
  assert.match(view, /min-height: 400px/);
  assert.match(view, /\.join-side\s*\{[\s\S]*?min-width: 380px/);
});

test('positions the insecure-context banner outside the document flow', () => {
  const view = readFileSync(styleFile, 'utf8');

  assert.match(view, /\.preconference-view\s*\{[\s\S]*?position: relative/);
  assert.match(view, /\.pre-fault-banner\s*\{[\s\S]*?position: absolute/);
  assert.match(view, /\.pre-fault-banner\s*\{[\s\S]*?top: 76px/);
  assert.match(view, /\.pre-fault-banner\s*\{[\s\S]*?left: 40px/);
  assert.match(view, /\.pre-fault-banner\s*\{[\s\S]*?right: 40px/);
});
