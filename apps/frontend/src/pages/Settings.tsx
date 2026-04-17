import { useCallback, useState } from "react";
import SettingsForm from "@/components/forms/SettingsForm.tsx";
import {
  applyTheme,
  getStoredTheme,
  type ThemeId,
} from "@/lib/theme.ts";

export default function Settings() {
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());

  const onThemeChange = useCallback((value: string) => {
    const next = value as ThemeId;
    applyTheme(next);
    setTheme(next);
  }, []);

  return (
    <div className="bg-muted/50 flex min-h-0 flex-1 flex-col overflow-auto rounded-xl p-10">
      <SettingsForm theme={theme} onThemeChange={onThemeChange} />
    </div>
  );
}