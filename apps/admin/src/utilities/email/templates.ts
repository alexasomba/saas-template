import { getServerSideURL } from "@/utilities/getURL";

export const buildOrderConfirmationEmail = ({
  accessToken,
  orderID,
}: {
  accessToken: string;
  orderID: number | string;
}) => {
  const orderURL = `${getServerSideURL()}/checkout/confirm-order?orderId=${encodeURIComponent(
    String(orderID),
  )}&accessToken=${encodeURIComponent(accessToken)}`;

  return {
    subject: `Order #${orderID} confirmed`,
    html: `
      <p>Thanks for your order.</p>
      <p>Your order <strong>#${orderID}</strong> has been confirmed.</p>
      <p><a href="${orderURL}">View your order details</a></p>
    `,
    text: `Thanks for your order. Your order #${orderID} has been confirmed. View details: ${orderURL}`,
  };
};

export const buildAccountCreatedEmail = ({ email }: { email: string }) => {
  const loginURL = `${getServerSideURL()}/login`;

  return {
    subject: "Your account is ready",
    html: `
      <p>Your account has been created successfully for <strong>${email}</strong>.</p>
      <p><a href="${loginURL}">Sign in to your account</a></p>
    `,
    text: `Your account has been created successfully for ${email}. Sign in here: ${loginURL}`,
  };
};

export const buildVerifyEmail = ({ email, token }: { email: string; token: string }) => {
  const verifyURL = `${getServerSideURL()}/verify-email?token=${encodeURIComponent(
    token,
  )}&email=${encodeURIComponent(email)}`;

  return {
    subject: "Verify your email address",
    html: `
      <p>Confirm your email address to activate your account.</p>
      <p><a href="${verifyURL}">Verify your email</a></p>
    `,
    text: `Confirm your email address to activate your account: ${verifyURL}`,
  };
};

export const buildWelcomeEmail = ({ email, name }: { email: string; name?: string }) => {
  const loginURL = `${getServerSideURL()}/login`;
  const greeting = name ? `Hi ${name},` : "Welcome,";

  return {
    subject: "Welcome to AutomaticPallet.com",
    html: `
      <p>${greeting}</p>
      <p>Your account is verified and ready to use.</p>
      <p><a href="${loginURL}">Sign in to your account</a></p>
    `,
    text: `${greeting} Your account is verified and ready to use. Sign in here: ${loginURL}`,
  };
};

export const buildOrderStatusEmail = ({
  accessToken,
  orderID,
  status,
}: {
  accessToken: string;
  orderID: number | string;
  status: string;
}) => {
  const orderURL = `${getServerSideURL()}/checkout/confirm-order?orderId=${encodeURIComponent(
    String(orderID),
  )}&accessToken=${encodeURIComponent(accessToken)}`;

  const copyByStatus: Record<string, { subject: string; message: string }> = {
    cancelled: {
      subject: `Order #${orderID} cancelled`,
      message: `Your order #${orderID} has been cancelled.`,
    },
    completed: {
      subject: `Order #${orderID} completed`,
      message: `Your order #${orderID} has been completed and fulfilled.`,
    },
    processing: {
      subject: `Order #${orderID} is processing`,
      message: `Your order #${orderID} is now being processed.`,
    },
  };

  const resolved = copyByStatus[status] || {
    subject: `Order #${orderID} update`,
    message: `Your order #${orderID} status changed to ${status}.`,
  };

  return {
    subject: resolved.subject,
    html: `
      <p>${resolved.message}</p>
      <p><a href="${orderURL}">View your order details</a></p>
    `,
    text: `${resolved.message} View details: ${orderURL}`,
  };
};

export const buildCelebrateFirstPurchaseEmail = ({
  accessToken,
  orderID,
}: {
  accessToken: string;
  orderID: number | string;
}) => {
  const orderURL = `${getServerSideURL()}/checkout/confirm-order?orderId=${encodeURIComponent(
    String(orderID),
  )}&accessToken=${encodeURIComponent(accessToken)}`;

  return {
    subject: "Thanks for your first order",
    html: `
      <p>Welcome to AutomaticPallet.com.</p>
      <p>Your first order is in, and we are glad to have you with us.</p>
      <p><a href="${orderURL}">Review your order</a></p>
    `,
    text: `Welcome to AutomaticPallet.com. Your first order is in. Review it here: ${orderURL}`,
  };
};

export const buildAbandonedCartEmail = ({ email }: { email: string }) => {
  const checkoutURL = `${getServerSideURL()}/checkout`;

  return {
    subject: "You left something in your cart",
    html: `
      <p>You left items behind on AutomaticPallet.com.</p>
      <p>Your cart is still waiting if you want to finish checkout.</p>
      <p><a href="${checkoutURL}">Return to checkout</a></p>
    `,
    text: `You left items behind on AutomaticPallet.com. Return to checkout: ${checkoutURL}`,
  };
};

export const buildWinBackEmail = ({ email }: { email: string }) => {
  const searchURL = `${getServerSideURL()}/search`;

  return {
    subject: "Come back and see what is new",
    html: `
      <p>It has been a little while since your last order.</p>
      <p>We would love to have you back.</p>
      <p><a href="${searchURL}">Browse the catalog</a></p>
    `,
    text: `It has been a little while since your last order. Browse the catalog: ${searchURL}`,
  };
};

export const buildQuoteExpiryReminderEmail = ({
  daysUntilExpiry,
  quoteNumber,
  recipientEmail,
}: {
  daysUntilExpiry: number;
  quoteNumber: string;
  recipientEmail: string;
}) => {
  const quotesURL = `${getServerSideURL()}/account?email=${encodeURIComponent(recipientEmail)}`;
  const timeCopy =
    daysUntilExpiry <= 0
      ? "today"
      : daysUntilExpiry === 1
        ? "tomorrow"
        : `in ${daysUntilExpiry} days`;

  return {
    subject: `Quote ${quoteNumber} expires ${timeCopy}`,
    html: `
      <p>Your quote <strong>${quoteNumber}</strong> is set to expire ${timeCopy}.</p>
      <p>If you want to move forward, please review it before the expiry date.</p>
      <p><a href="${quotesURL}">Open your account</a></p>
    `,
    text: `Your quote ${quoteNumber} expires ${timeCopy}. Review it here: ${quotesURL}`,
  };
};

export const buildInvoiceDueReminderEmail = ({
  daysUntilDue,
  invoiceNumber,
  recipientEmail,
}: {
  daysUntilDue: number;
  invoiceNumber: string;
  recipientEmail: string;
}) => {
  const invoicesURL = `${getServerSideURL()}/account?email=${encodeURIComponent(recipientEmail)}`;
  const timeCopy =
    daysUntilDue <= 0 ? "today" : daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;

  return {
    subject: `Invoice ${invoiceNumber} is due ${timeCopy}`,
    html: `
      <p>Your invoice <strong>${invoiceNumber}</strong> is due ${timeCopy}.</p>
      <p>Please review the invoice and arrange payment before the due date.</p>
      <p><a href="${invoicesURL}">Open your account</a></p>
    `,
    text: `Your invoice ${invoiceNumber} is due ${timeCopy}. Review it here: ${invoicesURL}`,
  };
};

export const buildInvoiceOverdueReminderEmail = ({
  daysOverdue,
  invoiceNumber,
  recipientEmail,
}: {
  daysOverdue: number;
  invoiceNumber: string;
  recipientEmail: string;
}) => {
  const invoicesURL = `${getServerSideURL()}/account?email=${encodeURIComponent(recipientEmail)}`;
  const dayCopy = daysOverdue === 1 ? "1 day" : `${daysOverdue} days`;

  return {
    subject: `Invoice ${invoiceNumber} is overdue`,
    html: `
      <p>Your invoice <strong>${invoiceNumber}</strong> is now overdue by ${dayCopy}.</p>
      <p>Please review the invoice and settle the outstanding balance as soon as possible.</p>
      <p><a href="${invoicesURL}">Open your account</a></p>
    `,
    text: `Your invoice ${invoiceNumber} is overdue by ${dayCopy}. Review it here: ${invoicesURL}`,
  };
};
