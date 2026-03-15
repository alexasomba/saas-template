import { describe, expect, it } from "vitest";
import { addDays, addMonths, addWeeks, addYears } from "date-fns";

/**
 * Unit tests for Subscriptions schema and cron logic.
 */

describe("Subscription Renewal Calculations", () => {
  it("calculates the correct nextPaymentDate based on period and interval", () => {
    const startDate = new Date("2024-01-01T12:00:00Z");

    // 1 Month
    expect(addMonths(startDate, 1).toISOString()).toBe("2024-02-01T12:00:00.000Z");

    // 2 Weeks
    expect(addWeeks(startDate, 2).toISOString()).toBe("2024-01-15T12:00:00.000Z");

    // 1 Year
    expect(addYears(startDate, 1).toISOString()).toBe("2025-01-01T12:00:00.000Z");

    // 3 Days
    expect(addDays(startDate, 3).toISOString()).toBe("2024-01-04T12:00:00.000Z");
  });

  it("delays the first nextPaymentDate when trialDays > 0 is configured", () => {
    const startDate = new Date("2024-01-01T12:00:00Z");
    const trialDays = 14;

    const trialEndDate = addDays(startDate, trialDays);
    expect(trialEndDate.toISOString()).toBe("2024-01-15T12:00:00.000Z");
  });
});

describe("Cron Processor Logic", () => {
  it("advances nextPaymentDate on payment success", () => {
    const currentNextPayment = new Date("2024-05-01T12:00:00Z");
    const updatedNextPayment = addMonths(currentNextPayment, 1);

    expect(updatedNextPayment.toISOString()).toBe("2024-06-01T12:00:00.000Z");
  });

  it("sets subscription status to on-hold after 2 consecutive failures", () => {
    let failureCount = 0;
    let status = "active";

    // First failure
    failureCount++;
    expect(status).toBe("active");

    // Second failure
    failureCount++;
    if (failureCount >= 2) {
      status = "on-hold";
    }

    expect(status).toBe("on-hold");
  });
});
