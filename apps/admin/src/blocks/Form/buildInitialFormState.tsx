import type { FormFieldBlock, TextField } from "@payloadcms/plugin-form-builder/types";
import type { DefaultValues } from "react-hook-form";

type NumberFieldBlock = Omit<TextField, "blockType"> & { blockType: "number" };

type ExtendedFieldBlock = FormFieldBlock | NumberFieldBlock;

export const buildInitialFormState = (
  fields: ExtendedFieldBlock[],
): DefaultValues<Record<string, unknown>> => {
  return fields.reduce<DefaultValues<Record<string, unknown>>>((initialSchema, field) => {
    switch (field.blockType) {
      case "checkbox":
        return {
          ...initialSchema,
          [field.name]: field.defaultValue,
        };
      case "country":
      case "date":
      case "email":
      case "number":
      case "radio":
      case "select":
      case "state":
      case "text":
      case "textarea":
        return {
          ...initialSchema,
          [field.name]: "",
        };
      default:
        return initialSchema;
    }
  }, {});
};
