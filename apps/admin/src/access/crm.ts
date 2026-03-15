import type { Access, Where } from "payload";

import { checkRole } from "@/access/utilities";
import type { UserRole } from "@/types/user";

import type { AccessArgs } from "payload";

const hasCRMRole = (roles: UserRole[]) => {
  const access = ({ req: { user } }: AccessArgs) => {
    if (!user) {
      return false;
    }

    return checkRole(roles, user) as boolean;
  };

  return access;
};

export const crmAdminAccess = hasCRMRole(["admin"]);
export const crmMarketingAccess = hasCRMRole(["admin", "marketing", "revops"]);
export const crmSalesAccess = hasCRMRole(["admin", "sales", "revops"]);
export const crmServiceAccess = hasCRMRole(["admin", "service", "revops"]);
export const crmFinanceAccess = hasCRMRole(["admin", "finance"]);
export const crmReadAccess = hasCRMRole([
  "admin",
  "marketing",
  "sales",
  "service",
  "revops",
  "finance",
]);
export const crmWriteContactAccess = hasCRMRole([
  "admin",
  "marketing",
  "sales",
  "service",
  "revops",
]);
export const crmCompanyAccess = hasCRMRole(["admin", "sales", "service", "revops"]);
export const crmDealReadAccess = hasCRMRole(["admin", "sales", "service", "revops", "finance"]);
export const crmDealWriteAccess = hasCRMRole(["admin", "sales", "revops"]);
export const crmTicketReadAccess = hasCRMRole(["admin", "sales", "service", "revops", "finance"]);
export const crmTicketWriteAccess = hasCRMRole(["admin", "service", "revops"]);
export const crmNoteReadAccess = hasCRMRole([
  "admin",
  "marketing",
  "sales",
  "service",
  "revops",
  "finance",
]);
export const crmNoteWriteAccess = hasCRMRole(["admin", "sales", "service", "revops"]);

const canBypassOwnership = (user: Parameters<Access>[0]["req"]["user"]) =>
  Boolean(user && checkRole(["admin", "revops"], user));

const getUserID = (user: Parameters<Access>[0]["req"]["user"]) =>
  typeof user?.id === "number" ? user.id : undefined;

const ownFieldAccess = ({ field, roles }: { field: string; roles: UserRole[] }): Access => {
  return ({ req: { user } }) => {
    if (!user || !checkRole(roles, user)) {
      return false;
    }

    if (canBypassOwnership(user)) {
      return true;
    }

    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      [field]: {
        equals: userID,
      },
    };
  };
};

export const crmContactReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "marketing", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["sales", "service"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      or: [
        {
          owner: {
            equals: userID,
          },
        },
        {
          accountManager: {
            equals: userID,
          },
        },
      ],
    } as Where;
  }

  return false;
};

export const crmContactWriteAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "marketing", "revops"], user)) {
    return true;
  }

  if (checkRole(["sales", "service"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      or: [
        {
          owner: {
            equals: userID,
          },
        },
        {
          accountManager: {
            equals: userID,
          },
        },
      ],
    } as Where;
  }

  return false;
};

export const crmCompanyReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["sales", "service"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      owner: {
        equals: userID,
      },
    };
  }

  return false;
};

export const crmCompanyWriteAccess = ownFieldAccess({
  field: "owner",
  roles: ["admin", "sales", "service", "revops"],
});

export const crmDealScopedReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "service", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["sales"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      owner: {
        equals: userID,
      },
    };
  }

  return false;
};

export const crmDealScopedWriteAccess = ownFieldAccess({
  field: "owner",
  roles: ["admin", "sales", "revops"],
});

export const crmTicketScopedReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "sales", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["service"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      or: [
        {
          assignee: {
            equals: userID,
          },
        },
        {
          assignee: {
            exists: false,
          },
        },
      ],
    };
  }

  return false;
};

export const crmTicketScopedWriteAccess = ownFieldAccess({
  field: "assignee",
  roles: ["admin", "service", "revops"],
});

export const crmNoteScopedReadAccess = crmReadAccess;

export const crmNoteScopedWriteAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "revops"], user)) {
    return true;
  }

  if (checkRole(["sales", "service"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      author: {
        equals: userID,
      },
    };
  }

  return false;
};

export const crmQuoteReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "marketing", "service", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["sales"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      owner: {
        equals: userID,
      },
    };
  }

  return false;
};

export const crmQuoteCreateAccess = hasCRMRole(["admin", "sales", "revops"]);
export const crmQuoteWriteAccess = ownFieldAccess({
  field: "owner",
  roles: ["admin", "sales", "revops"],
});

export const crmInvoiceReadAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (checkRole(["admin", "service", "revops", "finance"], user)) {
    return true;
  }

  if (checkRole(["sales"], user)) {
    const userID = getUserID(user);
    if (!userID) {
      return false;
    }

    return {
      owner: {
        equals: userID,
      },
    };
  }

  return false;
};

export const crmInvoiceCreateAccess = hasCRMRole(["admin", "finance", "revops"]);
export const crmInvoiceWriteAccess = hasCRMRole(["admin", "finance", "revops"]);
