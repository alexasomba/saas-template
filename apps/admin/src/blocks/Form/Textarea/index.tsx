import type { TextAreaField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea as TextAreaComponent } from "@/components/ui/textarea";
import React from "react";

import { Width } from "../Width";
import { capitaliseFirstLetter } from "@/utilities/capitaliseFirstLetter";
import { FormItem } from "@/components/forms/FormItem";
import { FormError } from "@/components/forms/FormError";

export const Textarea: React.FC<
  TextAreaField & {
    errors: FieldErrors<FieldValues>;
    register: UseFormRegister<FieldValues>;
    rows?: number;
  }
> = ({
  name,
  defaultValue,
  errors,
  label,
  register,
  required: requiredFromProps,
  rows = 3,
  width,
}) => {
  const fieldError = errors[name as keyof FieldValues];
  const message =
    fieldError && typeof fieldError === "object" && "message" in fieldError
      ? fieldError.message
      : undefined;

  return (
    <Width width={width}>
      <FormItem>
        <Label htmlFor={name}>{label}</Label>
        <TextAreaComponent
          defaultValue={defaultValue}
          id={name}
          rows={rows}
          {...register(name, {
            required: requiredFromProps
              ? `${capitaliseFirstLetter(label || name)} is required.`
              : undefined,
          })}
        />
        {typeof message === "string" && <FormError message={message} />}
      </FormItem>
    </Width>
  );
};
