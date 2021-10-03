import type { UseJSONFileResult } from "@Hooks/UseJSONFile/types";
import type { Mocked } from "@Mocks/ts-utils";
import { result } from "error-result";

export type MockedJsonFile = {
  mock: "mock";
};

export type MockedConfig = Mocked<UseJSONFileResult<MockedJsonFile>>;

export const configFileMock: MockedConfig = {
  getData: jest.fn(() => Promise.resolve(result({ mock: "mock" }))),
  isFileExists: jest.fn(() => Promise.resolve(true)),
  location: undefined,
  setData: jest.fn(),
  setFilePath: jest.fn(),
};

export const useJSONFile = jest.fn((filePath?: string): MockedConfig => {
  return configFileMock;
});
