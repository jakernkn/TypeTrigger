import { useCallback, useEffect, useState } from 'react';

export default function PermissionBanner(): React.JSX.Element | null {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback((): void => {
    window.api.checkAccessibility().then(setGranted);
  }, []);

  useEffect(() => {
    check();
    // Permission can be granted in System Settings while we're open; poll cheaply.
    const timer = setInterval(check, 3000);
    return () => clearInterval(timer);
  }, [check]);

  if (granted !== false) return null;

  return (
    <div className="permission-banner">
      <strong>Accessibility permission needed.</strong>
      <p>
        TypeTrigger can't type keystrokes until it's allowed under System Settings →
        Privacy &amp; Security → Accessibility (and Input Monitoring, if listed). When
        running in development, grant the permission to <em>Electron</em> — or to the
        terminal app you launched it from.
      </p>
      <div className="row">
        <button type="button" onClick={() => window.api.requestAccessibility().then(check)}>
          Request permission
        </button>
        <button type="button" onClick={() => window.api.openAccessibilitySettings()}>
          Open System Settings
        </button>
      </div>
    </div>
  );
}
