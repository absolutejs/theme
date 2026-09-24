# @absolutejs/theme
Shared Light / Dark / System preferences. Apps own their CSS palette and controls.

`themeScript` from `@absolutejs/theme` is a static inline bootstrap. Render it before visible content to restore the saved preference before paint; supply a CSP nonce/hash if your app requires one. It writes `data-theme` and `color-scheme` on the document root. Supply CSS media-query defaults for System when JavaScript is unavailable.

React: `const { preference, resolved, setPreference } = useTheme()` from `@absolutejs/theme/react`. Use `preference` for a three-option selector and `resolved` for canvas/material colors. Defaults to System, reacts to OS changes, syncs across tabs, tolerates unavailable storage, and cleans up listeners. No provider is required. The server snapshot is deterministic for hydration; browser resolution is available after hydration.

Other frameworks: `createThemeStore(window)` exposes `subscribe`, `getSnapshot`, and `setPreference`. Create one store per document and unsubscribe on teardown. Call subscribe to activate system/storage listeners. SSR can use the exported immutable `serverTheme` snapshot.

The preference is stored under `absolutejs.theme` for the current origin. There is no account or cross-device synchronization. Browser storage failures keep the preference in memory for the current page. Changing to System resumes OS tracking.
