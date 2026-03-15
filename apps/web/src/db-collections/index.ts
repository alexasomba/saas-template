import { createCollection, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  user: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

let _messagesCollection: any;

export function getMessagesCollection() {
  if (!_messagesCollection) {
    _messagesCollection = createCollection(
      localOnlyCollectionOptions({
        getKey: (message: any) => message.id,
        schema: MessageSchema,
      }),
    );
  }
  return _messagesCollection;
}
