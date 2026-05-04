import { useCallback, useEffect, useState } from "react";
import SettingsForm from "@/components/forms/SettingsForm.tsx";
import { applyTheme, THEME_IDS, type ThemeId, applyTextSize, applyIconSize, type SizeValue, storeView } from "@/lib/theme.ts";
import { Button } from "@/elements/buttons/button.tsx";
import type { UserSettings } from "db";
import useMainContext from "@/components/auth/hooks/main-context.tsx";
import { HelpHint } from "@/elements/help-hint.tsx";

type SettingsState = {
  theme: ThemeId;
  iconSize: string;
  textSize: string;
  tagsEnabled: boolean;
  listEnabled: boolean;
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: "hanover blue",
  iconSize: "Medium",
  textSize: "Medium",
  tagsEnabled: true,
  listEnabled: false,
};

function normalizeTheme(raw: string): ThemeId {
  const lower = raw.toLowerCase() as ThemeId;
  return (THEME_IDS as readonly string[]).includes(lower) ? lower : "hanover blue";
}

export default function Settings() {
  const { setTagsEnabled, setView } = useMainContext();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>("TEST");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch settings");
        return res.json() as Promise<UserSettings>;
      })
      .then((data) => {
        setSettings({
          theme: normalizeTheme(data.theme),
          iconSize: data.iconSize,
          textSize: data.textSize,
          tagsEnabled: data.tagsEnabled,
          listEnabled: data.listEnabled,
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load settings. Using defaults.");
      })
      .finally(() => setLoading(false));
  }, []);

  const onThemeChange = useCallback((value: string) => {
    setSettings((prev) => ({ ...prev, theme: value as ThemeId }));
  }, []);

  const applySettings = (useSettings: SettingsState) => {
    applyTheme(useSettings.theme);
    applyTextSize(useSettings.textSize as SizeValue);
    applyIconSize(useSettings.iconSize as SizeValue);
    setTagsEnabled(useSettings.tagsEnabled);
    const view = useSettings.listEnabled ? "List" : "Grid";
    storeView(view);
    setView(view);
  }

  const handleSave = () => {
    setError(null);
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save settings");
        applySettings(settings)
      })
      .catch((err) => {
        console.error(err);
        setError("Could not save settings. Please try again.");
      });
  };

  useEffect(() => {
    handleSave()
  }, [settings])

  if (loading) {
    return (
      <div className="bg-muted/50 flex min-h-0 flex-1 items-center justify-center rounded-xl">
        <p className="text-muted-foreground text-sm">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 flex min-h-0 flex-1 flex-col overflow-auto rounded-xl p-10 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <HelpHint contentClassName="max-w-sm">
              Personal preferences for your account: theme, text and icon size, tags on
              cards, and the default documents view (grid or list). Save Changes stores
              them on the server and applies them in this browser.
            </HelpHint>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your personal preferences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
              onClick={handleSave}
              className="transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
          >Save Changes
          </Button>
        </div>
      </div>

      <SettingsForm
        theme={settings.theme}
        onThemeChange={onThemeChange}
        iconSize={settings.iconSize}
        onIconSizeChange={(v) => setSettings((prev) => ({ ...prev, iconSize: v }))}
        textSize={settings.textSize}
        onTextSizeChange={(v) => setSettings((prev) => ({ ...prev, textSize: v }))}
        tagsEnabled={settings.tagsEnabled}
        onTagsEnabledChange={(v) => setSettings((prev) => ({ ...prev, tagsEnabled: v }))}
        listEnabled={settings.listEnabled}
        onListEnabledChange={(v) => setSettings((prev) => ({ ...prev, listEnabled: v }))}
      />
    </div>
  );
}
