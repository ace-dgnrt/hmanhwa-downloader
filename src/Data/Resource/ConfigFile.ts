import { UNDEFINED_VALUE } from "@Data/Constants";

export type ResourceConfigFile = {
  url: string;
  title: string;
  chapterNumber: number;
  hash: string;
  images: string[];

  loadingFinished: boolean;
  createdAtUTC: number;
  updatedAtUTC: number;
};

export const RESOURCE_CONF_FILE_NAME = "config.json";

export const INITIAL_RESOURCE_CONFIG: ResourceConfigFile = {
  url: UNDEFINED_VALUE,
  title: UNDEFINED_VALUE,
  chapterNumber: -1,
  hash: UNDEFINED_VALUE,
  images: [],

  loadingFinished: false,
  updatedAtUTC: 0,
  createdAtUTC: 0,
};
