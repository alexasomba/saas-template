import type { ShippingZone } from "@/payload-types";

export type ShippingMethod = {
  id: string;
  label: string;
  cost: number;
  methodType: "flatRate" | "freeShipping" | "localPickup";
};

/**
 * Matches a shipping address to a shipping zone and returns available methods.
 */
export const matchShippingZone = (
  zones: ShippingZone[],
  country: string,
  state: string,
): ShippingZone | undefined => {
  // Sort zones if needed, but usually Payload returns them in order
  // A 'Rest of World' zone might have no locations or a specific catch-all

  return zones.find((zone) => {
    if (!zone.locations || zone.locations.length === 0) return false;

    return zone.locations.some((loc) => {
      const countryMatch = loc.country === country;
      const stateMatch = !loc.state || loc.state === state; // State is optional for broad country matching

      return countryMatch && stateMatch;
    });
  });
};

export const getMethodsFromZone = (zone: ShippingZone, subtotal: number): ShippingMethod[] => {
  if (!zone.methods) return [];

  const methods: ShippingMethod[] = [];

  zone.methods.forEach((method, index) => {
    const id = `${zone.id}-${method.blockType}-${index}`;

    if (method.blockType === "flatRate") {
      methods.push({
        id,
        label: `Flat Rate`,
        cost: method.cost || 0,
        methodType: "flatRate",
      });
    } else if (method.blockType === "freeShipping") {
      const minAmount = method.minAmount || 0;
      if (!method.requires || method.requires === "none" || subtotal >= minAmount) {
        methods.push({
          id,
          label: "Free Shipping",
          cost: 0,
          methodType: "freeShipping",
        });
      }
    } else if (method.blockType === "localPickup") {
      methods.push({
        id,
        label: "Local Pickup",
        cost: method.cost || 0,
        methodType: "localPickup",
      });
    }
  });

  return methods;
};
