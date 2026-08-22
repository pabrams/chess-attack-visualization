import '@testing-library/jest-dom/vitest';

const store = new Map();
const mock = {
  getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
  setItem: (k, v) => { store.set(String(k), String(v)); },
  removeItem: (k) => { store.delete(String(k)); },
  clear: () => { store.clear(); },
  key: (i) => Array.from(store.keys())[i] ?? null,
  get length() { return store.size; },
};
Object.defineProperty(globalThis, 'localStorage', { value: mock, configurable: true, writable: true });
Object.defineProperty(window, 'localStorage', { value: mock, configurable: true, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: { ...mock }, configurable: true, writable: true });
