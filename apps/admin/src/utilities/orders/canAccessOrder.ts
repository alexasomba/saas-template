import type { Order } from "@/payload-types";

type UserLike =
  | {
      id: string | number;
    }
  | null
  | undefined;

export function canAccessOrder({
  order,
  user,
  accessToken,
  inviteToken,
}: {
  order: Pick<Order, "accountInvite" | "accessToken" | "customer"> | null | undefined;
  user?: UserLike;
  accessToken?: string;
  inviteToken?: string;
}) {
  if (!order) {
    return false;
  }

  const belongsToUser =
    user &&
    order.customer &&
    (typeof order.customer === "object"
      ? String(order.customer.id) === String(user.id)
      : String(order.customer) === String(user.id));

  const matchesAccessToken = accessToken && order.accessToken && accessToken === order.accessToken;
  const matchesInviteToken = inviteToken && order.accountInvite?.token === inviteToken;

  return Boolean(belongsToUser || matchesAccessToken || matchesInviteToken);
}
