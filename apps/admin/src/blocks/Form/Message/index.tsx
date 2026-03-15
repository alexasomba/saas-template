import type { MessageField } from "@payloadcms/plugin-form-builder/types";
import { RichText } from "@/components/RichText";
import React from "react";

import { Width } from "../Width";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

const isSerializedEditorState = (value: MessageField["message"]): value is SerializedEditorState =>
  Boolean(value && typeof value === "object" && "root" in value);

export const Message: React.FC<{ message: MessageField["message"] }> = ({ message }) => {
  if (!isSerializedEditorState(message)) {
    return null;
  }

  return (
    <Width className="my-12" width="100">
      <RichText data={message} />
    </Width>
  );
};
