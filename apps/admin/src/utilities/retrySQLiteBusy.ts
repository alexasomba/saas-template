const SQLITE_BUSY_PATTERNS = ["SQLITE_BUSY", "database is locked"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isSQLiteBusyError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  return SQLITE_BUSY_PATTERNS.some((pattern) => error.message.includes(pattern));
};

export async function retrySQLiteBusy<T>(
  operation: () => Promise<T>,
  {
    attempts = 3,
    delayMs = 250,
  }: {
    attempts?: number;
    delayMs?: number;
  } = {},
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (attempt >= attempts || !isSQLiteBusyError(error)) {
        throw error;
      }

      await wait(delayMs * attempt);
    }
  }
}
