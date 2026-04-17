import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/forms/Field";
import { RadioGroup, RadioGroupItem } from "@/elements/radio-group";
import type { ThemeId } from "@/lib/theme.ts";
import { Separator } from "@/elements/separator.tsx"

function ThemeOption(props: {
  themeName: string;
  themeValue: ThemeId;
  themeDescription: string;
}) {
  const { themeName, themeValue, themeDescription } = props;

  return (
    <FieldLabel htmlFor={themeValue}>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>{themeName}</FieldTitle>
          <FieldDescription>{themeDescription}</FieldDescription>
        </FieldContent>
        <RadioGroupItem value={themeValue} id={themeValue} />
      </Field>
    </FieldLabel>
  );
}

export default function SettingsForm({
  theme,
  onThemeChange,
}: {
  theme: ThemeId;
  onThemeChange: (value: string) => void;
}) {
  return (
    <FieldGroup className="w-full">
      <FieldSet>
        <FieldLegend variant="label">Website Theme</FieldLegend>
        <FieldDescription>
          Select the color scheme for your work environment!
        </FieldDescription>
        <Separator />
        <RadioGroup className="grid grid-flow-row grid-cols-3" value={theme} onValueChange={onThemeChange}>
          <ThemeOption
            themeName="Hanover Blue"
            themeValue="hanover blue"
            themeDescription="A simple and sleek color scheme based on Hanover Blue"
          />
          <ThemeOption
            themeName="Times"
            themeValue="times"
            themeDescription="Newsprint palette with Baskerville headings and Helserif body text"
          />
          <ThemeOption
            themeName="Dark"
            themeValue="dark"
            themeDescription="Low-light surfaces with cool blue accents"
          />
          <ThemeOption
            themeName="Berry"
            themeValue="berry"
            themeDescription="A vibrant pink and green theme to make your documents pop!"
          />
          <ThemeOption
            themeName="Retro"
            themeValue="retro"
            themeDescription="A 70's based color scheme to remember the good ol' days."
          />
          <ThemeOption
            themeName="Quasar"
            themeValue="quasar"
            themeDescription="A pink and purple theme for the child in us all."
          />
          <ThemeOption
            themeName="Tritanomoly"
            themeValue="tritanomoly"
            themeDescription="A turquoise based theme to provide a calming environment"
          />
          <ThemeOption
            themeName="Kylie"
            themeValue="kylie"
            themeDescription="A very, VERY pink theme."
          />
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  );
}

