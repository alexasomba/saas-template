export const scheduledDraftVersions = {
  drafts: {
    autosave: {
      interval: 100,
    },
    schedulePublish: true,
  },
  maxPerDoc: 50,
} as const;

export const setPublishedAtIfPublishing = ({
  siblingData,
  value,
}: {
  siblingData: { _status?: string };
  value?: Date;
}) => {
  if (siblingData._status === "published" && !value) {
    return new Date();
  }

  return value;
};
