export type ParsedCartError = {
  code?: string;
  isOutOfStock: boolean;
  message: string;
};

const defaultMessage = "Unable to update the cart. Please try again.";
const defaultStockMessage = "This item is no longer in stock.";

const extractMessage = (value: unknown): string | undefined => {
  if (!value || typeof value !== "object") return undefined;
  if ("message" in value && typeof (value as { message?: unknown }).message === "string") {
    return (value as { message: string }).message;
  }

  if ("error" in value) {
    const errorValue = (value as { error?: unknown }).error;

    if (typeof errorValue === "string") return errorValue;
    if (
      errorValue &&
      typeof errorValue === "object" &&
      "message" in errorValue &&
      typeof (errorValue as { message?: unknown }).message === "string"
    ) {
      return (errorValue as { message: string }).message;
    }
  }

  if ("errors" in value && Array.isArray((value as { errors?: unknown[] }).errors)) {
    const match = (value as { errors: Array<{ message?: string }> }).errors.find(
      (item) => typeof item?.message === "string",
    );

    if (match?.message) return match.message;
  }

  return undefined;
};

const determineStockHint = (payload: Record<string, unknown>): boolean => {
  const status = typeof payload.status === "number" ? payload.status : undefined;
  if (status === 409) return true;

  const codeCandidates: Array<unknown> = [];
  if ("code" in payload) codeCandidates.push(payload.code);
  if ("cause" in payload && payload.cause && typeof payload.cause === "object") {
    const cause = payload.cause as Record<string, unknown>;
    if ("code" in cause) codeCandidates.push(cause.code);
  }
  if ("error" in payload && payload.error && typeof payload.error === "object") {
    const err = payload.error as Record<string, unknown>;
    if ("code" in err) codeCandidates.push(err.code);
  }

  if (
    codeCandidates.some(
      (value) => typeof value === "string" && value.toLowerCase().includes("stock"),
    )
  ) {
    return true;
  }

  const message = extractMessage(payload);
  if (message && message.toLowerCase().includes("stock")) return true;

  return false;
};

export const parseCartError = (error: unknown): ParsedCartError => {
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as Record<string, unknown>;
      const message = extractMessage(parsed);

      return {
        code: typeof parsed.code === "string" ? parsed.code : undefined,
        isOutOfStock: determineStockHint(parsed),
        message: message || (determineStockHint(parsed) ? defaultStockMessage : defaultMessage),
      };
    } catch {
      const normalized = error.message.trim();

      return {
        code: undefined,
        isOutOfStock: normalized.toLowerCase().includes("stock") || normalized.includes("409"),
        message:
          normalized ||
          (normalized.toLowerCase().includes("stock") ? defaultStockMessage : defaultMessage),
      };
    }
  }

  return {
    code: undefined,
    isOutOfStock: false,
    message: defaultMessage,
  };
};
