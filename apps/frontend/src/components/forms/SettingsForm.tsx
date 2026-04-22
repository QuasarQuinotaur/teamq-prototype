import {
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from "@/components/forms/Field";
import { THEME_IDS, type ThemeId } from "@/lib/theme.ts";
import { Separator } from "@/elements/separator.tsx";
import { cn } from "@/lib/utils.ts";
import { CheckIcon, ChevronDownIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible.tsx";
import { Item } from "@/elements/item.tsx";
import { Button } from "@/elements/buttons/button.tsx";
import { Switch } from "@/elements/switch.tsx";

// ─── Theme card ───────────────────────────────────────────────────────────────

type ThemeColors = {
  background: string;
  backgroundAccent: string;
  foregroundAccent: string;
  highlight: string;
};

const THEME_META: Record<ThemeId, { name: string; colors: ThemeColors }> = {
  "hanover blue": {
    name: "Hanover Blue",
    colors: { background: "#FAFAF9", backgroundAccent: "#EEEEEE", foregroundAccent: "#003150", highlight: "#0069A8" },
  },
  times: {
    name: "Times",
    colors: { background: "#faf8f5", backgroundAccent: "#e7e5e4", foregroundAccent: "#151515", highlight: "#5a5a5a" },
  },
  dark: {
    name: "Dark",
    colors: { background: "#0e141e", backgroundAccent: "#1d2736", foregroundAccent: "#3882c3", highlight: "#55aee8" },
  },
  quasar: {
    name: "Quasar",
    colors: { background: "#421536", backgroundAccent: "#66174e", foregroundAccent: "#A63A82", highlight: "#C25DA9" },
  },
  retro: {
    name: "Retro",
    colors: { background: "#f4f4f3", backgroundAccent: "#efefef", foregroundAccent: "#05456f", highlight: "#F96635" },
  },
  kylie: {
    name: "Kylie",
    colors: { background: "#ba65a4", backgroundAccent: "#d290bd", foregroundAccent: "#7e205f", highlight: "#f5e0f0" },
  },
  tritanomoly: {
    name: "Tritanomoly",
    colors: { background: "#eaf0e6", backgroundAccent: "#b0bab2", foregroundAccent: "#354F52", highlight: "#80b5a7" },
  },
};

function ThemeCard({ themeValue, isSelected, onSelect }: {
  themeValue: ThemeId;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { name, colors } = THEME_META[themeValue];
  const { background, backgroundAccent, foregroundAccent, highlight } = colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-all text-left border-2",
        isSelected ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/40"
      )}
    >
      <div className="flex flex-col" style={{ background: backgroundAccent }}>
        <div className="flex items-center gap-1 px-2" style={{ background: backgroundAccent, height: 14 }}>
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: highlight }} />
          <div className="h-1 w-8 rounded-full" style={{ background: foregroundAccent, opacity: 0.5 }} />
        </div>
        <div className="flex" style={{ background, height: 72 }}>
          <div className="flex flex-col gap-1.5 px-1.5 py-2" style={{ background: backgroundAccent, width: 28 }}>
            <div className="h-1 rounded-full" style={{ background: highlight, opacity: 0.9 }} />
            <div className="h-1 rounded-full" style={{ background: foregroundAccent, opacity: 0.35 }} />
            <div className="h-1 rounded-full" style={{ background: foregroundAccent, opacity: 0.35 }} />
            <div className="h-1 rounded-full" style={{ background: foregroundAccent, opacity: 0.35 }} />
          </div>
          <div className="flex-1 flex flex-col gap-1.5 p-2">
            <div className="h-2 w-2/3 rounded-full" style={{ background: foregroundAccent, opacity: 0.7 }} />
            <div className="h-1 w-full rounded-full" style={{ background: foregroundAccent, opacity: 0.2 }} />
            <div className="h-1 w-5/6 rounded-full" style={{ background: foregroundAccent, opacity: 0.2 }} />
            <div className="h-1 w-3/4 rounded-full" style={{ background: foregroundAccent, opacity: 0.2 }} />
            <div className="mt-0.5 h-3.5 w-10 rounded" style={{ background: highlight, opacity: 0.85 }} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1.5" style={{ background: backgroundAccent }}>
        <span className="text-xs font-medium" style={{ color: foregroundAccent }}>{name}</span>
        {isSelected && <CheckIcon className="size-3" style={{ color: highlight }} />}
      </div>
    </button>
  );
}

// ─── Size selector ────────────────────────────────────────────────────────────

const SIZE_OPTIONS: { value: string; textClass: string; iconSize: number; label: string }[] = [
  { value: "Small",  textClass: "text-xs",   iconSize: 12, label: "Small"  },
  { value: "Medium", textClass: "text-base",  iconSize: 16, label: "Medium" },
  { value: "Large",  textClass: "text-xl",    iconSize: 22, label: "Large"  },
];

function TextSizeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Item variant="outline" role="group" aria-label="Text size" className="w-fit max-w-none gap-0 overflow-hidden p-0 flex-nowrap">
      {SIZE_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? "default" : "ghost"}
          className="rounded-none border-0 shadow-none px-4 h-9"
          aria-pressed={value === opt.value}
          aria-label={opt.label}
          title={opt.label}
          onClick={() => onChange(opt.value)}
        >
          <span className={cn("font-medium leading-none", opt.textClass)}>Aa</span>
        </Button>
      ))}
    </Item>
  );
}

function IconSizeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Item variant="outline" role="group" aria-label="Icon size" className="w-fit max-w-none gap-0 overflow-hidden p-0 flex-nowrap">
      {SIZE_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? "default" : "ghost"}
          className="rounded-none border-0 shadow-none px-4 h-9"
          aria-pressed={value === opt.value}
          aria-label={opt.label}
          title={opt.label}
          onClick={() => onChange(opt.value)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: opt.iconSize, height: opt.iconSize }}
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </Button>
      ))}
    </Item>
  );
}

// ─── Tags toggle (eye icon pair) ──────────────────────────────────────────────

function TagsToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Item variant="outline" role="group" aria-label="Tags visibility" className="w-fit max-w-none gap-0 overflow-hidden p-0 flex-nowrap">
      <Button
        type="button"
        variant={value ? "default" : "ghost"}
        size="icon-lg"
        className="rounded-none border-0 shadow-none"
        aria-pressed={value}
        aria-label="Showing"
        title="Showing"
        onClick={() => onChange(true)}
      >
        <EyeIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant={!value ? "default" : "ghost"}
        size="icon-lg"
        className="rounded-none border-0 shadow-none"
        aria-pressed={!value}
        aria-label="Hidden"
        title="Hidden"
        onClick={() => onChange(false)}
      >
        <EyeOffIcon className="size-4" />
      </Button>
    </Item>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({ title, description, defaultOpen = true, children }: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/60"
        >
          <div>
            <p className="text-sm font-medium leading-none">{title}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <Separator className="mt-2" />
      <CollapsibleContent className="overflow-hidden">
        <div className="pt-4 pb-1 flex flex-col gap-5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Row layout helper ────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function SettingsForm({
  theme, onThemeChange,
  iconSize, onIconSizeChange,
  textSize, onTextSizeChange,
  tagsEnabled, onTagsEnabledChange,
  listEnabled, onListEnabledChange,
}: {
  theme: ThemeId;
  onThemeChange: (value: string) => void;
  iconSize: string;
  onIconSizeChange: (value: string) => void;
  textSize: string;
  onTextSizeChange: (value: string) => void;
  tagsEnabled: boolean;
  onTagsEnabledChange: (value: boolean) => void;
  listEnabled: boolean;
  onListEnabledChange: (value: boolean) => void;
}) {
  return (
    <FieldGroup className="w-full">
      <SettingsSection
        title="Website Theme"
        description="Select the color scheme for your work environment."
      >
        <div className="grid grid-cols-4 gap-3">
          {THEME_IDS.map((id) => (
            <ThemeCard key={id} themeValue={id} isSelected={theme === id} onSelect={() => onThemeChange(id)} />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Display"
        description="Customize the size of icons and text throughout the app."
      >
        <SettingRow label="Icon Size">
          <IconSizeSelector value={iconSize} onChange={onIconSizeChange} />
        </SettingRow>
        <SettingRow label="Text Size">
          <TextSizeSelector value={textSize} onChange={onTextSizeChange} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Features"
        description="Toggle optional features on or off."
      >
        <SettingRow
          label="Tags"
          description="Show tag labels on documents and enable tag filtering."
        >
          <TagsToggle value={tagsEnabled} onChange={onTagsEnabledChange} />
        </SettingRow>

        <SettingRow
          label="List View"
          description="Default to list view instead of grid view for documents."
        >
          <Switch
            checked={listEnabled}
            onCheckedChange={onListEnabledChange}
            aria-label="List view"
          />
        </SettingRow>
      </SettingsSection>
    </FieldGroup>
  );
}
