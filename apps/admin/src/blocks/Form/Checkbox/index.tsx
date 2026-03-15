import type { CheckboxField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

import { useFormContext } from "react-hook-form";

import { Checkbox as CheckboxUi } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import React from "react";

import { Width } from "../Width";
import { capitaliseFirstLetter } from "@/utilities/capitaliseFirstLetter";
import { FormError } from "@/components/forms/FormError";

export const Checkbox: React.FC<
  CheckboxField & {
    errors: FieldErrors<FieldValues>;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  const props = register(name, {
    required: requiredFromProps
      ? `${capitaliseFirstLetter(label || name)} is required.`
      : undefined,
  });
  const { setValue } = useFormContext();
  const fieldError = errors[name as keyof FieldValues];
  const message =
    fieldError && typeof fieldError === "object" && "message" in fieldError
      ? fieldError.message
      : undefined;

  return (
    <Width width={width}>
      <div className="flex items-center gap-2">
        <CheckboxUi
          defaultChecked={defaultValue}
          id={name}
          {...props}
          onCheckedChange={(checked) => {
            setValue(props.name, checked);
          }}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
      {typeof message === "string" && <FormError message={message} />}
    </Width>
  );
};
