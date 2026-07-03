import { shell, systemPreferences } from 'electron';

export function hasAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(false);
}

/** Shows the macOS prompt and adds the app to the Accessibility list (unchecked). */
export function requestAccessibilityPermission(): boolean {
  if (process.platform !== 'darwin') return true;
  return systemPreferences.isTrustedAccessibilityClient(true);
}

export function openAccessibilitySettings(): void {
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
  );
}
