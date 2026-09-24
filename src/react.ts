import { useSyncExternalStore } from 'react';
import { createThemeStore, serverTheme, type ThemePreference } from './index';
export * from './index';
const stores = new WeakMap<Window, ReturnType<typeof createThemeStore>>();
const noop = () => () => {};
const getServerSnapshot = () => serverTheme;
/** Shared, hydration-safe preference with automatic system and cross-tab updates. */
export function useTheme() {
  let store: ReturnType<typeof createThemeStore> | undefined;
  if (typeof window !== 'undefined') {
    store = stores.get(window);
    if (!store) { store = createThemeStore(window); stores.set(window, store); }
  }
  const snapshot = useSyncExternalStore(store?.subscribe ?? noop, store?.getSnapshot ?? getServerSnapshot, getServerSnapshot);
  return { ...snapshot, setPreference: store?.setPreference ?? ((_value: ThemePreference) => {}) };
}
