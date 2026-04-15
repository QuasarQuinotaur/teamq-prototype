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


export default function SettingsForm( { onThemeChange }) {


    return (
        <FieldGroup className="w-full max-w-xs">
            <FieldSet>
                <FieldLegend variant="label">Website Theme</FieldLegend>
                <FieldDescription>
                    Select the color scheme for your work environment!
                </FieldDescription>
                <RadioGroup defaultValue="default" onValueChange={onThemeChange}>
                    <FieldLabel htmlFor="default">
                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldTitle>Hanover Blue</FieldTitle>
                                <FieldDescription>
                                    A simple and sleek color scheme based on the Hanover Blue.
                                </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="theme-default" id="default"/>
                        </Field>
                    </FieldLabel>
                    <FieldLabel htmlFor="berries">
                        <Field orientation="horizontal">
                            <FieldContent>
                                <FieldTitle>Berries</FieldTitle>
                                <FieldDescription>
                                    A vibrant pink and green theme to make your documents pop!
                                </FieldDescription>
                            </FieldContent>
                            <RadioGroupItem value="theme-berry" id="berries" />
                        </Field>
                    </FieldLabel>
                </RadioGroup>
            </FieldSet>
        </FieldGroup>
    )
}
