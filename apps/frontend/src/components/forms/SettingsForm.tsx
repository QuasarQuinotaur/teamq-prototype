import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from "@/components/forms/Field"
import { RadioGroup, RadioGroupItem } from "@/elements/radio-group"

function ThemeOption( props: {themeName: string, themeDescription: string} ) {
    const themeName = props.themeName
    const themeValue = themeName.toLowerCase()
    const themeDescription = props.themeDescription

    return (
        <FieldLabel htmlFor={themeValue}>
            <Field orientation="horizontal">
                <FieldContent>
                    <FieldTitle>{themeName}</FieldTitle>
                    <FieldDescription>
                        {themeDescription}
                    </FieldDescription>
                </FieldContent>
                <RadioGroupItem value={themeValue} id={themeValue} />
            </Field>
        </FieldLabel>
    )
}

export default function SettingsForm( { onThemeChange }) {
    const theme = document.documentElement.getAttribute("data-theme")

    return (
        <FieldGroup className="w-full max-w-xs">
            <FieldSet>
                <FieldLegend variant="label">Website Theme</FieldLegend>
                <FieldDescription>
                    Select the color scheme for your work environment!
                </FieldDescription>
                <RadioGroup defaultValue={theme} onValueChange={onThemeChange}>
                    <ThemeOption themeName="Hanover Blue" themeDescription="A simple and sleek color scheme based on Hanover Blue" />
                    <ThemeOption themeName="Berry" themeDescription="A vibrant pink and green theme to make your documents pop!" />
                    <ThemeOption themeName="Retro" themeDescription="A 70's based color scheme to remember the good ol' days." />
                    <ThemeOption themeName="Quasar" themeDescription="A pink and purple theme for the child in us all." />
                    <ThemeOption themeName="Tritanomoly" themeDescription="A turquoise based theme to provide a calming environment" />
                    <ThemeOption themeName="Kylie" themeDescription="A very, VERY pink theme." />
                </RadioGroup>
            </FieldSet>
        </FieldGroup>
    )
}

