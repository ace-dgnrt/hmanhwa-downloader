import { UNDEFINED_VALUE } from "@Data/Constants";

export type ManhwaConfigFile = {
  url: string;
  title: string;
  hash: string;
  relatedResources: Array<{ url: string; hash: string }>;

  archiveFile: {
    fileName: string;
    containedResources: string[];
  };

  createdAtUTC: number;
  updatedAtUTC: number;
};

export const MANHWA_CONF_FILE_NAME = "manhwa-config.json";

export const INITIAL_MANHWA_CONFIG: ManhwaConfigFile = {
  url: UNDEFINED_VALUE,
  title: UNDEFINED_VALUE,
  hash: UNDEFINED_VALUE,
  relatedResources: [],

  archiveFile: {
    fileName: UNDEFINED_VALUE,
    containedResources: [],
  },

  updatedAtUTC: 0,
  createdAtUTC: 0,
};
