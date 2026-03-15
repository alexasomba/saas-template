import { draftMode } from "next/headers";

type DraftModeReader = typeof draftMode;

const isDynamicServerUsageError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "digest" in error &&
  (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE";

export async function getDraftModeEnabled(readDraftMode: DraftModeReader = draftMode) {
  try {
    const { isEnabled } = await readDraftMode();
    return isEnabled;
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      return false;
    }

    throw error;
  }
}
