import { expect, test } from 'bun:test';
import { createThemeStore, themeScript, themeStorageKey } from '../src';
function browser(dark = true, blocked = false) {
  const media = Object.assign(new EventTarget(), { matches: dark });
  const values = new Map<string, string>();
  const root = { dataset: {} as Record<string,string>, style: {} as Record<string,string> };
  const storage = { getItem: (key: string) => { if(blocked) throw Error(); return values.get(key) ?? null; }, setItem: (key: string, value: string) => {if(blocked) throw Error(); values.set(key,value);} };
  const target = Object.assign(new EventTarget(), { document: { documentElement: root }, matchMedia: () => media, localStorage: storage });
  return { target: target as unknown as Window, media, values, root, storage };
}
test('system tracks OS; manual override persists and ignores OS until System is selected', () => {
  const b = browser(); const store = createThemeStore(b.target); let updates = 0;
  const stop = store.subscribe(() => updates++);
  expect(b.root.dataset.theme).toBe('dark');
  store.setPreference('light'); expect(b.values.get(themeStorageKey)).toBe('light');
  b.media.matches = false; b.media.dispatchEvent(new Event('change'));
  b.media.matches = true; b.media.dispatchEvent(new Event('change'));
  expect(store.getSnapshot().resolved).toBe('light'); expect(updates).toBe(1);
  store.setPreference('system'); expect(store.getSnapshot().resolved).toBe('dark');
  stop(); b.media.matches = false; b.media.dispatchEvent(new Event('change'));
  expect(store.getSnapshot().resolved).toBe('dark');
  store.subscribe(() => {}); expect(store.getSnapshot().resolved).toBe('light');
});
test('blocked storage still supports overrides', () => {
  const b=browser(true,true); const store=createThemeStore(b.target); store.subscribe(()=>{});
  store.setPreference('light'); expect(store.getSnapshot().resolved).toBe('light');
});
test('other tabs update preference; clearing storage restores system', () => {
  const b=browser(); const store=createThemeStore(b.target); store.subscribe(()=>{});
  b.target.dispatchEvent(Object.assign(new Event('storage'), {key:themeStorageKey,newValue:'light',storageArea:b.storage}));
  expect(store.getSnapshot().resolved).toBe('light');
  b.target.dispatchEvent(Object.assign(new Event('storage'), {key:null,newValue:null,storageArea:b.storage}));
  expect(store.getSnapshot().preference).toBe('system');
});
test('bootstrap resolves before hydration including blocked storage and malformed preference', () => {
  for(const blocked of [false,true]) {
    const b=browser(true,blocked); b.values.set(themeStorageKey,'invalid');
    new Function('localStorage','matchMedia','document',themeScript)(b.storage,b.target.matchMedia,b.target.document);
    expect(b.root.dataset.theme).toBe('dark');
  }
  const b=browser(true); b.values.set(themeStorageKey,'light');
  new Function('localStorage','matchMedia','document',themeScript)(b.storage,b.target.matchMedia,b.target.document);
  expect(b.root.dataset.theme).toBe('light');
});
