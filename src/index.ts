export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';
export type ThemeSnapshot = Readonly<{ preference: ThemePreference; resolved: Theme }>;
export const themeStorageKey = 'absolutejs.theme';
export const parseTheme = (value: unknown): ThemePreference => value === 'light' || value === 'dark' ? value : 'system';
export const resolveTheme = (preference: ThemePreference, systemDark: boolean): Theme => preference === 'system' ? systemDark ? 'dark' : 'light' : preference;
export const serverTheme: ThemeSnapshot = Object.freeze({ preference: 'system', resolved: 'light' });

/** Run before visible content. No user-controlled text is interpolated. Allow via CSP nonce/hash when required. */
export const themeScript = `(()=>{let p='system';try{p=localStorage.getItem('absolutejs.theme')}catch{}p=p==='dark'||p==='light'?p:'system';const t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()`;

/** One controller per document. No browser globals are accessed during module evaluation or SSR. */
export function createThemeStore(target: Window) {
  const media = target.matchMedia('(prefers-color-scheme: dark)');
  const listeners = new Set<() => void>();
  let preference: ThemePreference = 'system';
  try { preference = parseTheme(target.localStorage.getItem(themeStorageKey)); } catch {}
  let snapshot: ThemeSnapshot = { preference, resolved: resolveTheme(preference, media.matches) };
  let listening = false;
  const apply = () => {
    const resolved = resolveTheme(preference, media.matches);
    target.document.documentElement.dataset.theme = resolved;
    target.document.documentElement.style.colorScheme = resolved;
    if (snapshot.preference === preference && snapshot.resolved === resolved) return;
    snapshot = Object.freeze({ preference, resolved });
    listeners.forEach(listener => listener());
  };
  const storage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== themeStorageKey) return;
    try { if (event.storageArea && event.storageArea !== target.localStorage) return; } catch {}
    preference = parseTheme(event.newValue);
    apply();
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (!listening) {
        // Catch OS/storage changes that happened while there were no subscribers.
        try { preference = parseTheme(target.localStorage.getItem(themeStorageKey)); } catch {}
        media.addEventListener('change', apply);
        target.addEventListener('storage', storage);
        listening = true;
        apply();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          media.removeEventListener('change', apply);
          target.removeEventListener('storage', storage);
          listening = false;
        }
      };
    },
    setPreference(value: ThemePreference) {
      preference = parseTheme(value);
      try { target.localStorage.setItem(themeStorageKey, preference); } catch {}
      apply();
    },
  };
}
