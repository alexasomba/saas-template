import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

import { createCollection, localOnlyCollectionOptions } from "@tanstack/react-db";
import { z } from "zod";

const IncomingMessageSchema = z.object({
  user: z.string(),
  text: z.string(),
});

const MessageSchema = IncomingMessageSchema.extend({
  id: z.number(),
});

export type Message = z.infer<typeof MessageSchema>;

let _serverMessagesCollection: any;
let _id = 0;

function getServerMessagesCollection() {
  if (!_serverMessagesCollection) {
    _serverMessagesCollection = createCollection(
      localOnlyCollectionOptions({
        getKey: (message: any) => message.id,
        schema: MessageSchema,
      }),
    );

    _serverMessagesCollection.insert({
      id: _id++,
      user: "Alice",
      text: "Hello, how are you?",
    });
    _serverMessagesCollection.insert({
      id: _id++,
      user: "Bob",
      text: "I'm fine, thank you!",
    });
  }
  return _serverMessagesCollection;
}

const sendMessage = (message: { user: string; text: string }) => {
  getServerMessagesCollection().insert({
    id: _id++,
    user: message.user,
    text: message.text,
  });
};

export const Route = createFileRoute("/demo/db-chat-api")({
  server: {
    handlers: {
      GET: () => {
        const collection = getServerMessagesCollection();
        const stream = new ReadableStream({
          start(controller) {
            for (const [_id, message] of collection.state) {
              controller.enqueue(JSON.stringify(message) + "\n");
            }
            collection.subscribeChanges((changes: any) => {
              for (const change of changes) {
                if (change.type === "insert") {
                  controller.enqueue(JSON.stringify(change.value) + "\n");
                }
              }
            });
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
          },
        });
      },
      POST: async ({ request }) => {
        const message = IncomingMessageSchema.safeParse(await request.json());
        if (!message.success) {
          return new Response(message.error.message, { status: 400 });
        }
        sendMessage(message.data);
        return json(message.data);
      },
    },
  },
});
