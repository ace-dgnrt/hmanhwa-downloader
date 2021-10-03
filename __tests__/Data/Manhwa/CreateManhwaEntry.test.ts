import { error, result } from "error-result";
import md5 from "md5";

import { UNDEFINED_VALUE } from "@Data/Constants";
import { ManhwaConfigFile } from "@Data/Manhwa/ConfigFile";
import { createManhwaEntry } from "@Data/Manhwa/CreateManhwaEntry";
import { createResource } from "@Data/Resource/CreateResource";
import { resourceStore } from "@Data/Resources";
import { useJSONFile } from "@Hooks/UseJSONFile/UseJSONFile";
import { mockedManhwaFile } from "@Mocks/Data/Manhwa/ManhwaFile";
import { configFileMock } from "@Mocks/Hooks/UseJSONFile/UseJSONFile";

import { sleep } from "../../test_helpers/sleep";

const useJSONFileMock = useJSONFile as jest.Mock;

jest.mock("@Hooks/UseJSONFile/UseJSONFile", () =>
  jest.requireActual("@Mocks/Hooks/UseJSONFile/UseJSONFile")
);

jest.mock("@Data/Manhwa/ManhwaFile", () =>
  jest.requireActual("@Mocks/Data/Manhwa/ManhwaFile")
);

describe("Manhwa", () => {
  it("should set all properties", () => {
    configFileMock.isFileExists.mockImplementationOnce(() =>
      Promise.resolve(false)
    );

    const manhwa = createManhwaEntry("config.json");

    expect(manhwa.url).toEqual("");
    expect(manhwa.title).toEqual("");
    expect(manhwa.hash).toEqual("");
    expect(manhwa.relatedResources).toEqual([]);

    const url = "http://example.com";
    const title = "Title";
    const hash = md5(url);
    const relatedResources = [
      {
        url: "foo",
        hash: md5("foo"),
      },
      {
        url: "bar",
        hash: md5("bar"),
      },
    ];

    manhwa.setTitle(title);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      title,
      updatedAtUTC: expect.any(Number),
    });

    manhwa.setUrl(url);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      url,
      hash,
      updatedAtUTC: expect.any(Number),
    });

    manhwa.addResourceRelation(relatedResources[0].url);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      relatedResources: [relatedResources[0]],
      updatedAtUTC: expect.any(Number),
    });

    manhwa.addResourceRelation(relatedResources[1].url);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      relatedResources: relatedResources,
      updatedAtUTC: expect.any(Number),
    });

    expect(manhwa.url).toEqual(url);
    expect(manhwa.title).toEqual(title);
    expect(manhwa.hash).toEqual(hash);
    expect(manhwa.relatedResources).toContainEqual(relatedResources[0]);
    expect(manhwa.relatedResources).toContainEqual(relatedResources[1]);
  });

  describe("should correctly set its own state based on the config file", () => {
    it("with positive scenario", async () => {
      const config: ManhwaConfigFile = {
        title: "my title",
        url: "www.example.com",
        hash: md5("www.example.com"),
        relatedResources: [
          { url: "baz", hash: md5("baz") },
          { url: "qux", hash: md5("qux") },
        ],

        archiveFile: {
          fileName: UNDEFINED_VALUE,
          containedResources: [],
        },

        createdAtUTC: 1,
        updatedAtUTC: 1,
      };

      const mockedConf = {
        getData: jest.fn(() => Promise.resolve(result(config))),
        isFileExists: jest.fn(() => Promise.resolve(true)),
        location: "location",
        setData: jest.fn(),
        setFilePath: jest.fn(),
      };

      useJSONFileMock.mockImplementationOnce(() => mockedConf);

      const manhwa = createManhwaEntry("config.json");

      await sleep(5);

      expect(manhwa.url).toEqual(config.url);
      expect(manhwa.title).toEqual(config.title);
      expect(manhwa.hash).toEqual(config.hash);
      expect(manhwa.relatedResources).toEqual(config.relatedResources);
    });

    it("with negative scenario", async () => {
      const mockedConf = {
        getData: jest.fn(() => Promise.resolve(result({}))),
        isFileExists: jest.fn(() => Promise.resolve(false)),
        location: "location",
        setData: jest.fn(),
        setFilePath: jest.fn(),
      };

      useJSONFileMock.mockImplementationOnce(() => mockedConf);

      createManhwaEntry("config.json");

      await sleep(5);

      expect(mockedConf.setData).toHaveBeenCalledTimes(1);
      expect(mockedConf.setData).toHaveBeenCalledWith({
        url: UNDEFINED_VALUE,
        title: UNDEFINED_VALUE,
        hash: UNDEFINED_VALUE,
        relatedResources: [],

        archiveFile: {
          fileName: UNDEFINED_VALUE,
          containedResources: [],
        },

        updatedAtUTC: expect.any(Number),
        createdAtUTC: expect.any(Number),
      });
    });
  });

  describe(".getFile", () => {
    beforeEach(() => {
      resourceStore.clear();
    });

    it("should return path to the archived file if the file exists and contains all resources", async () => {
      const manhwa = createManhwaEntry("config.json");

      manhwa.addResourceRelation("foo");
      manhwa.addResourceRelation("bar");

      // File Mock will exist if no more than two resources are present
      const fpath = await manhwa.getFile();

      expect(fpath.error).toEqual(null);
      expect(fpath.data).toEqual("location");
    });

    it("should return an error if any of the resources does not exists", async () => {
      const manhwa = createManhwaEntry("config.json");

      manhwa.addResourceRelation("foo");
      manhwa.addResourceRelation("bar");
      manhwa.addResourceRelation("baz");

      const fpath = await manhwa.getFile();

      expect(fpath.error).toEqual(
        Error("One of the related resources does not exist.")
      );
    });

    it("should return an error if any of the resources does not exists", async () => {
      const manhwa = createManhwaEntry("config.json");

      const res1 = createResource("");
      const res2 = createResource("");
      const res3 = createResource("");

      res1.setUrl("foo");
      res2.setUrl("bar");
      res3.setUrl("baz");

      resourceStore.addResource(res1);
      resourceStore.addResource(res2);
      resourceStore.addResource(res3);

      manhwa.addResourceRelation(res1.url);
      manhwa.addResourceRelation(res2.url);
      manhwa.addResourceRelation(res3.url);

      const fpath = await manhwa.getFile();

      expect(fpath.error).toEqual(
        Error("One of the related resources is not ready yet.")
      );
    });

    it("should return an error if creating archive file failed", async () => {
      mockedManhwaFile.createNewFile.mockImplementationOnce(() =>
        Promise.resolve(error("Archive Creation Failed"))
      );

      const manhwa = createManhwaEntry("config.json");

      const res1 = createResource("");
      const res2 = createResource("");
      const res3 = createResource("");

      res1.setUrl("foo");
      res2.setUrl("bar");
      res3.setUrl("baz");

      res1.setLoaded();
      res2.setLoaded();
      res3.setLoaded();

      resourceStore.addResource(res1);
      resourceStore.addResource(res2);
      resourceStore.addResource(res3);

      manhwa.addResourceRelation(res1.url);
      manhwa.addResourceRelation(res2.url);
      manhwa.addResourceRelation(res3.url);

      const fpath = await manhwa.getFile();

      expect(fpath.error).toEqual(Error("Archive Creation Failed"));
    });

    it("should return file path after successfully creating the file", async () => {
      const manhwa = createManhwaEntry("config.json");

      const res1 = createResource("");
      const res2 = createResource("");
      const res3 = createResource("");

      res1.setUrl("foo");
      res2.setUrl("bar");
      res3.setUrl("baz");

      res1.setLoaded();
      res2.setLoaded();
      res3.setLoaded();

      resourceStore.addResource(res1);
      resourceStore.addResource(res2);
      resourceStore.addResource(res3);

      manhwa.addResourceRelation(res1.url);
      manhwa.addResourceRelation(res2.url);
      manhwa.addResourceRelation(res3.url);

      const fpath = await manhwa.getFile();

      expect(fpath.error).toEqual(null);
      expect(fpath.data).toEqual("location");
    });
  });

  describe(".getLocallyAvailableResources", () => {
    beforeEach(() => {
      resourceStore.clear();
    });

    it("should return all related resources present in the resourceStore", () => {
      const manhwa = createManhwaEntry("");

      const res1 = createResource("");
      const res2 = createResource("");

      res1.setUrl("foo");
      res2.setUrl("bar");

      resourceStore.addResource(res1);

      manhwa.addResourceRelation(res1.url);
      manhwa.addResourceRelation(res2.url);

      const availableRes = manhwa.getLocallyAvailableResources();

      expect(availableRes.length).toEqual(1);
      expect(availableRes[0]).toStrictEqual(res1);
    });
  });

  describe(".getHashesOfUnavailableResources", () => {
    beforeEach(() => {
      resourceStore.clear();
    });

    it("should return urls and hashes of all related resources not present in the resourceStore", () => {
      const manhwa = createManhwaEntry("");

      const res1 = createResource("");
      const res2 = createResource("");

      res1.setUrl("foo");
      res2.setUrl("bar");

      resourceStore.addResource(res1);

      manhwa.addResourceRelation(res1.url);
      manhwa.addResourceRelation(res2.url);

      const availableRes = manhwa.getHashesOfUnavailableResources();

      expect(availableRes.length).toEqual(1);
      expect(availableRes[0]).toEqual({ url: res2.url, hash: res2.hash });
    });
  });
});
