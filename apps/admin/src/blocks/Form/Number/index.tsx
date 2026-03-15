import type { TextField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

import { Width } from "../Width";
import { FormError } from "@/components/forms/FormError";
import { FormItem } from "@/components/forms/FormItem";
import { capitaliseFirstLetter } from "@/utilities/capitaliseFirstLetter";
type NumberProps = Omit<TextField, "blockType"> & { blockType: "text" | "number" };

export const Number: React.FC<
  NumberProps & {
    errors: FieldErrors<FieldValues>;
    register: UseFormRegister<FieldValues>;
  }
> = ({ name, defaultValue, errors, label, register, required: requiredFromProps, width }) => {
  const fieldError = errors[name as keyof FieldValues];
  const message =
    fieldError && typeof fieldError === "object" && "message" in fieldError
      ? fieldError.message
      : undefined;

  return (
    <Width width={width}>
      <FormItem>
        <Label htmlFor={name}>{label}</Label>
        <Input
          defaultValue={defaultValue}
          id={name}
          type="number"
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
