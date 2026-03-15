import { auth, setAuth } from "@workspace/auth";
import { db } from "@workspace/db";
import { tanstackStartCookies } from "better-auth/tanstack-start";

setAuth({
  db,
  plugins: [tanstackStartCookies()],
});

export { auth };
