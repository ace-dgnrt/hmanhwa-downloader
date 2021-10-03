import type { UseManhwaFileResult } from "@Data/Manhwa/ManhwaFile";
import type { Mocked } from "@Mocks/ts-utils";
import { result } from "error-result";

export const mockedManhwaFile: Mocked<UseManhwaFileResult> = {
  setFile: jest.fn(),
  isFileContainsAllResources: jest.fn((rr) => (rr.length <= 2 ? true : false)),
  createNewFile: jest.fn((fp, res) => Promise.resolve(result("location"))),
  filePath: "location",
};

export const useManhwaFile = jest.fn(
  (filePath?: string): UseManhwaFileResult => {
    return mockedManhwaFile;
  }
);
