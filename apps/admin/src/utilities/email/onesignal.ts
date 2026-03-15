export interface OneSignalAdapterArgs {
  appId: string;
  restApiKey: string;
  defaultFromAddress?: string;
  defaultFromName?: string;
}

const parseEmailAddress = (value?: string | null) => {
  if (!value) return null;

  const formattedMatch = value.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (formattedMatch) {
    return {
      address: formattedMatch[2]?.trim() || "",
      name: formattedMatch[1]?.trim() || undefined,
    };
  }

  return {
    address: value.trim(),
    name: undefined,
  };
};

const normalizeRecipients = (to: unknown): string[] => {
  if (!to) return [];

  if (typeof to === "string") {
    const parsed = parseEmailAddress(to);
    return parsed?.address ? [parsed.address] : [];
  }

  if (Array.isArray(to)) {
    return to
      .map((entry) => {
        if (typeof entry === "string") {
          return parseEmailAddress(entry)?.address || null;
        }

        if (entry && typeof entry === "object" && "address" in entry) {
          const address = entry.address;
          return typeof address === "string" ? address : null;
        }

        return null;
      })
      .filter((entry): entry is string => Boolean(entry));
  }

  if (typeof to === "object" && to && "address" in to) {
    const address = to.address;
    return typeof address === "string" ? [address] : [];
  }

  return [];
};

export const oneSignalEmailAdapter = (args: OneSignalAdapterArgs) => {
  const { appId, restApiKey, defaultFromAddress, defaultFromName } = args;

  return () => {
    const defaultFrom = parseEmailAddress(defaultFromAddress || "hello@automaticpallet.com");

    return {
      name: "onesignal",
      sendEmail: async (message: {
        to: string | string[] | { address?: string } | { address?: string }[];
        from?: string;
        subject: string;
        html?: string;
        replyTo?: string;
        text?: string;
      }) => {
        const { to, from, replyTo, subject, html, text } = message;
        const recipients = normalizeRecipients(to);
        const sender = parseEmailAddress(from) || defaultFrom;
        const replyToAddress = parseEmailAddress(replyTo)?.address;

        if (!sender?.address) {
          throw new Error("OneSignal Email Error: sender address is required");
        }

        if (recipients.length === 0) {
          throw new Error("OneSignal Email Error: at least one recipient is required");
        }

        const response = await fetch("https://api.onesignal.com/notifications?c=email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Key ${restApiKey}`,
          },
          body: JSON.stringify({
            app_id: appId,
            target_channel: "email",
            email_from_address: sender.address,
            email_from_name: sender.name || defaultFromName,
            email_subject: subject,
            email_body: html || text || "",
            email_to: recipients,
            ...(replyToAddress ? { email_reply_to_address: replyToAddress } : {}),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OneSignal Email Error: ${JSON.stringify(errorData)}`);
        }

        return response.json();
      },
      defaultFromAddress: defaultFrom?.address || "hello@automaticpallet.com",
      defaultFromName: defaultFrom?.name || defaultFromName || "Automatic Pallet",
    };
  };
};
