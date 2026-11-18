import type VConsole from 'vconsole';

declare global {
  interface Window {
    __roomkitVConsoleLogHooked?: boolean;
  }
}

const VCONSOLE_QUERY_KEY = 'vConsole';
const LOG_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;
const MAX_LOG_LINES = 1000;

let starting: Promise<void> | null = null;
let panel: VConsole | null = null;
const logLines: string[] = [];

function formatLogArg(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function recordLog(method: string, args: unknown[]) {
  const time = new Date().toISOString();
  logLines.push(`[${time}] [${method}] ${args.map(formatLogArg).join(' ')}`);
  if (logLines.length > MAX_LOG_LINES) {
    logLines.splice(0, logLines.length - MAX_LOG_LINES);
  }
}

function hookConsole() {
  if (window.__roomkitVConsoleLogHooked) {
    return;
  }
  window.__roomkitVConsoleLogHooked = true;
  LOG_METHODS.forEach((method) => {
    // Keep a copy of each console method so downloaded logs match the panel.
    // eslint-disable-next-line no-console
    const original = console[method].bind(console);
    // eslint-disable-next-line no-console
    console[method] = (...args: unknown[]) => {
      recordLog(method, args);
      original(...args);
    };
  });
}

function downloadLogs() {
  const content = logLines.join('\n');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const link = document.createElement('a');
  link.download = `vconsole-${stamp}.log`;
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function queryValue(params: URLSearchParams, key: string): string | null {
  const target = key.toLowerCase();
  for (const [name, value] of params) {
    if (name.toLowerCase() === target) {
      return value;
    }
  }
  return null;
}

function readQueryParam(key: string): string | null {
  const fromSearch = queryValue(new URLSearchParams(window.location.search), key);
  if (fromSearch) {
    return fromSearch;
  }
  const { hash } = window.location;
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) {
    return null;
  }
  return queryValue(new URLSearchParams(hash.slice(queryIndex + 1)), key);
}

export function setupVConsole(): Promise<void> {
  if (typeof window === 'undefined' || panel || starting) {
    return starting ?? Promise.resolve();
  }
  if (readQueryParam(VCONSOLE_QUERY_KEY) !== 'true') {
    return Promise.resolve();
  }
  starting = import('vconsole').then(({ default: VConsole }) => {
    hookConsole();
    const nextPanel = new VConsole();
    const plugin = new VConsole.VConsolePlugin('exportLog', 'Export');
    plugin.on('addTool', (callback) => {
      if (typeof callback !== 'function') {
        return;
      }
      callback([{
        name: 'Download',
        global: true,
        onClick: downloadLogs,
      }]);
    });
    nextPanel.addPlugin(plugin);
    panel = nextPanel;
  });
  return starting;
}
