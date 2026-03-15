import { redirect } from "next/navigation";

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        params.append(key, entry);
      });
    }
  });

  const query = params.toString();
  redirect(query ? `/forgot-password?${query}` : "/forgot-password");
}
