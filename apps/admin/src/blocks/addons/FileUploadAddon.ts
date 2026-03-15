import type { Block } from "payload";

import { baseAddonFields, pricingFields } from "./shared";

export const FileUploadAddon: Block = {
  slug: "fileUpload",
  interfaceName: "FileUploadAddonBlock",
  labels: {
    singular: "File Upload Add-on",
    plural: "File Upload Add-ons",
  },
  fields: [...baseAddonFields, ...pricingFields],
};
