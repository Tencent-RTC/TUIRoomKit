const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function renderRoutes(isLoggedIn) {
  const exports = {};
  const source = readFileSync(resolve(__dirname, '../../router/index.tsx'), 'utf8');
  const location = { pathname: '/home', search: '?roomId=123456', hash: '#invite' };
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require: name => {
      if (name === 'react') return { lazy: () => 'HomeView' };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === 'react-router-dom') return { Navigate: 'Navigate', useLocation: () => location, createSearchParams: values => new URLSearchParams(values) };
      assert.equal(name, '@/views/login/LoginView');
      return { default: 'Login' };
    },
    sessionStorage: { getItem: key => {
      assert.equal(key, 'tuiRoom-userInfo');
      return isLoggedIn ? '{}' : null;
    } },
  });
  return exports.RouterView().props.children;
}

test('an existing session replaces login with home without carrying login query or hash', () => {
  const loginRoute = renderRoutes(true).find(route => route.props.path === '/login').props.element;
  const login = loginRoute.type(loginRoute.props);
  assert.equal(login.type, 'Navigate');
  assert.equal(login.props.to, '/home');
  assert.equal(login.props.replace, true);
});

test('a logged-out visitor can log in and keeps the full protected-page redirect', () => {
  const routes = renderRoutes(false);
  const loginRoute = routes.find(route => route.props.path === '/login').props.element;
  assert.equal(loginRoute.type(loginRoute.props).type, 'Login');
  const home = routes.find(route => route.props.path === '/home').props.element;
  const redirect = home.type(home.props);
  assert.equal(redirect.type, 'Navigate');
  assert.equal(redirect.props.to.pathname, '/login');
  assert.equal(new URLSearchParams(redirect.props.to.search).get('redirect'), '/home?roomId=123456#invite');
  assert.equal(redirect.props.replace, true);
});

test('mobile login keeps the illustration after the non-shrinking form in normal flow', () => {
  const styles = readFileSync(resolve(__dirname, '../Login/LoginPage.scss'), 'utf8');
  const mobileStyles = styles.slice(styles.indexOf('@media (width <= 767px)'));
  const stageStyles = mobileStyles.match(/\.login-page-stage\s*\{([^}]+)/)[1];
  const cardStyles = mobileStyles.match(/\.login-page-card\s*\{([^}]+)/)[1];
  assert.match(mobileStyles, /\.login-page\s*\{\s*flex-direction: column;\s*padding: 72px 0 0;/);
  assert.match(stageStyles, /flex: none;/);
  assert.match(stageStyles, /order: 1;/);
  assert.match(stageStyles, /padding: 0 16px 22px;/);
  assert.doesNotMatch(stageStyles, /position:|bottom:|right:|z-index:|align-items:/);
  assert.match(cardStyles, /flex: 1 0 auto;/);
  assert.match(cardStyles, /padding: 0 28px 24px;/);
});

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
