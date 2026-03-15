"use client";
import type {
  Form as FormType,
  FormFieldBlock,
  MessageField,
  TextField,
} from "@payloadcms/plugin-form-builder/types";

import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { RichText } from "@/components/RichText";
import { Button } from "@/components/ui/button";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

import { buildInitialFormState } from "./buildInitialFormState";
import { Checkbox } from "./Checkbox";
import { Country } from "./Country";
import { Email } from "./Email";
import { Message } from "./Message";
import { Number as NumberField } from "./Number";
import { Select as SelectField } from "./Select";
import { State as StateField } from "./State";
import { Text } from "./Text";
import { Textarea } from "./Textarea";
import { getClientSideURL } from "@/utilities/getURL";
import { DefaultDocumentIDType } from "payload";

export type FormBlockType = {
  blockName?: string;
  blockType?: "formBlock";
  enableIntro: boolean;
  form: FormType;
  introContent?: SerializedEditorState;
};

type NumberFieldBlock = Omit<TextField, "blockType"> & { blockType: "number" };

type ExtendedFieldBlock = (FormFieldBlock | NumberFieldBlock) & {
  id?: DefaultDocumentIDType;
};

type FormSubmissionResponse = {
  errors?: Array<{ message?: string }>;
  status?: string;
};

type FormData = Record<string, unknown>;

export const FormBlock: React.FC<
  FormBlockType & {
    id?: DefaultDocumentIDType;
  }
> = (props) => {
  const {
    enableIntro,
    form: formFromProps,
    form: { id: formID, confirmationMessage, confirmationType, redirect, submitButtonLabel } = {},
    introContent,
  } = props;

  const formFields = (formFromProps?.fields ?? []) as ExtendedFieldBlock[];

  const formMethods = useForm<FormData>({
    defaultValues: buildInitialFormState(formFields),
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = formMethods;

  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>();
  const [error, setError] = useState<{ message: string; status?: string } | undefined>();
  const router = useRouter();

  const getFieldKey = useCallback((field: ExtendedFieldBlock, index: number): string => {
    if (field.id) return String(field.id);

    if ("name" in field && typeof field.name === "string") {
      return `${field.blockType}-${field.name}`;
    }

    return `${field.blockType}-${index}`;
  }, []);

  const onSubmit = useCallback(
    (data: FormData) => {
      let loadingTimerID: ReturnType<typeof setTimeout>;
      const submitForm = async () => {
        setError(undefined);

        const dataToSend = Object.entries(data).map(([name, value]) => ({
          field: name,
          value,
        }));

        // delay loading indicator by 1s
        loadingTimerID = setTimeout(() => {
          setIsLoading(true);
        }, 1000);

        try {
          const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
            body: JSON.stringify({
              form: formID,
              submissionData: dataToSend,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          });

          const res = (await req.json()) as FormSubmissionResponse;

          clearTimeout(loadingTimerID);

          if (req.status >= 400) {
            setIsLoading(false);

            setError({
              message: res.errors?.[0]?.message || "Internal Server Error",
              status: res.status,
            });

            return;
          }

          setIsLoading(false);
          setHasSubmitted(true);

          if (confirmationType === "redirect" && redirect) {
            const { url } = redirect;

            const redirectUrl = url;

            if (redirectUrl) router.push(redirectUrl);
          }
        } catch (err) {
          clearTimeout(loadingTimerID);
          console.warn(err);
          setIsLoading(false);
          setError({
            message: "Something went wrong.",
          });
        }
      };

      void submitForm();
    },
    [router, formID, redirect, confirmationType],
  );

  return (
    <div className="container lg:max-w-[48rem]">
      {enableIntro && introContent && !hasSubmitted && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="p-4 lg:p-6 border border-border rounded-[0.8rem]">
        <FormProvider {...formMethods}>
          {!isLoading && hasSubmitted && confirmationType === "message" && (
            <RichText data={confirmationMessage} />
          )}
          {isLoading && !hasSubmitted && <p>Loading, please wait...</p>}
          {error && <div>{`${error.status || "500"}: ${error.message || ""}`}</div>}
          {!hasSubmitted && (
            <form id={formID} onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4 last:mb-0">
                {formFields.map((field, index) => {
                  const resolvedKey = getFieldKey(field, index);

                  const renderedField = (() => {
                    switch (field.blockType) {
                      case "checkbox":
                        return <Checkbox {...field} errors={errors} register={register} />;
                      case "country":
                        return <Country {...field} control={control} errors={errors} />;
                      case "email":
                        return <Email {...field} errors={errors} register={register} />;
                      case "message":
                        return <Message message={(field as MessageField).message} />;
                      case "number":
                        return (
                          <NumberField
                            {...(field as NumberFieldBlock)}
                            errors={errors}
                            register={register}
                          />
                        );
                      case "select":
                        return <SelectField {...field} control={control} errors={errors} />;
                      case "state":
                        return <StateField {...field} control={control} errors={errors} />;
                      case "text":
                        return <Text {...field} errors={errors} register={register} />;
                      case "textarea":
                        return <Textarea {...field} errors={errors} register={register} />;
                      default:
                        return null;
                    }
                  })();

                  if (!renderedField) return null;

                  return (
                    <div className="mb-6 last:mb-0" key={resolvedKey}>
                      {renderedField}
                    </div>
                  );
                })}
              </div>

              <Button form={formID} type="submit" variant="default">
                {submitButtonLabel}
              </Button>
            </form>
          )}
        </FormProvider>
      </div>
    </div>
  );
};
