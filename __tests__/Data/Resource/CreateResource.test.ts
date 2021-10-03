import { error, result } from "error-result";
import md5 from "md5";
import path from "path";

import { UNDEFINED_VALUE } from "@Data/Constants";
import { ResourceConfigFile } from "@Data/Resource/ConfigFile";
import { createResource } from "@Data/Resource/CreateResource";
import { NewFileFacade } from "@Hooks/FileFacade";
import { useJSONFile } from "@Hooks/UseJSONFile/UseJSONFile";
import { configFileMock } from "@Mocks/Hooks/UseJSONFile/UseJSONFile";

import { sleep } from "../../test_helpers/sleep";
import { stripMethods } from "../../test_helpers/strip_methods";

jest.mock("@Hooks/UseJSONFile/UseJSONFile", () =>
  jest.requireActual("@Mocks/Hooks/UseJSONFile/UseJSONFile")
);

const useJSONFileMock = useJSONFile as jest.Mock;

describe("Resource", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should correctly set all properties", async () => {
    const resource = createResource("config.json");

    expect(resource.chapterNumber).toEqual(-1);
    expect(resource.hash).toEqual("");
    expect(resource.images).toEqual([]);
    expect(resource.resourceInvalid).toEqual(false);
    expect(resource.title).toEqual("");
    expect(resource.url).toEqual("");

    await sleep(10);

    expect(resource.resourceInvalid).toEqual(false);

    const url = "http://example.com";
    const title = "Title";
    const chapterNumber = 123;
    const hash = md5(url);
    const images = [NewFileFacade("image1.png"), NewFileFacade("image2.png")];

    resource.setUrl(url);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      hash,
      url,
      updatedAtUTC: expect.any(Number),
    });

    resource.setTitle(title);

    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      title,
      updatedAtUTC: expect.any(Number),
    });

    resource.setChapterNumber(chapterNumber);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      chapterNumber,
      updatedAtUTC: expect.any(Number),
    });

    resource.setImages(images);
    expect(configFileMock.setData).toHaveBeenLastCalledWith({
      images: expect.any(Array),
      updatedAtUTC: expect.any(Number),
    });

    expect(resource.chapterNumber).toEqual(chapterNumber);
    expect(resource.hash).toEqual(hash);
    expect(resource.images).toEqual(images);
    expect(resource.resourceInvalid).toEqual(false);
    expect(resource.title).toEqual(title);
    expect(resource.url).toEqual(url);
  });

  describe("should correctly set loading promise and 'invalid resource' flag", () => {
    it("with positive scenario", async () => {
      const resource = createResource("config.json");
      const onLoad = jest.fn();
      const onFail = jest.fn();

      resource.wait().then(({ error }) => {
        if (!error) onLoad();
        else onFail();
      });

      await sleep(10);

      expect(resource.resourceInvalid).toEqual(false);
      expect(onLoad).toHaveBeenCalledTimes(0);
      expect(onFail).toHaveBeenCalledTimes(0);

      resource.setLoaded();

      await sleep(0);

      expect(resource.resourceInvalid).toEqual(false);
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onFail).toHaveBeenCalledTimes(0);
    });

    it("with negative scenario", async () => {
      const resource = createResource("config.json");
      const onLoad = jest.fn();
      const onFail = jest.fn();

      resource.wait().then(({ error }) => {
        if (!error) onLoad();
        else onFail(error);
      });

      await sleep(10);

      expect(resource.resourceInvalid).toEqual(false);
      expect(onLoad).toHaveBeenCalledTimes(0);
      expect(onFail).toHaveBeenCalledTimes(0);

      resource.setLoadFailed(Error("error"));

      await sleep(0);

      expect(resource.resourceInvalid).toEqual(true);
      expect(onLoad).toHaveBeenCalledTimes(0);
      expect(onFail).toHaveBeenCalledTimes(1);

      expect(onFail).toHaveBeenCalledWith(Error("error"));
    });
  });

  describe("should correctly set its own state based on the config file", () => {
    const pathResolveMock = jest.spyOn(path, "resolve");
    const pathResolveMockOrgImplementation =
      pathResolveMock.getMockImplementation();

    beforeAll(() => {
      pathResolveMock.mockImplementation((...parts) => parts.join("/"));
    });

    afterAll(() => {
      pathResolveMock.mockImplementation(pathResolveMockOrgImplementation);
    });

    it("with positive scenario", async () => {
      const config: ResourceConfigFile = {
        chapterNumber: 2,
        title: "my title",
        images: ["image-1.jpg", "image-2.png"],
        url: "www.example.com",
        hash: md5("www.example.com"),
        loadingFinished: true,

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

      const resource = createResource("config.json");

      await sleep(5);

      expect(resource.chapterNumber).toEqual(config.chapterNumber);
      expect(resource.hash).toEqual(config.hash);
      expect(resource.images).toContainEqual(
        expect.objectContaining(
          stripMethods(
            NewFileFacade(path.resolve("location", config.images[1]))
          )
        )
      );
      expect(resource.images).toContainEqual(
        expect.objectContaining(
          stripMethods(
            NewFileFacade(path.resolve("location", config.images[1]))
          )
        )
      );
      expect(resource.resourceInvalid).toEqual(false);
      expect(resource.title).toEqual(config.title);
      expect(resource.url).toEqual(config.url);
    });

    it("with negative scenario - file exists but resource has not been loaded", async () => {
      const config: ResourceConfigFile = {
        chapterNumber: 4,
        title: "my title 2",
        images: ["image-3.jpg", "image-4.png"],
        url: "www.example-2.com",
        hash: md5("www.example-2.com"),
        loadingFinished: false,

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

      const resource = createResource("config.json");

      await sleep(5);

      expect(resource.resourceInvalid).toEqual(true);

      expect(resource.chapterNumber).not.toEqual(config.chapterNumber);
      expect(resource.hash).not.toEqual(config.hash);
      expect(resource.images).not.toContainEqual(
        expect.objectContaining(
          stripMethods(
            NewFileFacade(path.resolve("location", config.images[1]))
          )
        )
      );
      expect(resource.images).not.toContainEqual(
        expect.objectContaining(
          stripMethods(
            NewFileFacade(path.resolve("location", config.images[1]))
          )
        )
      );
      expect(resource.title).not.toEqual(config.title);
      expect(resource.url).not.toEqual(config.url);
    });

    it("with negative scenario - file does not exists", async () => {
      const mockedConf = {
        getData: jest.fn(() => Promise.resolve(result({}))),
        isFileExists: jest.fn(() => Promise.resolve(false)),
        location: "location",
        setData: jest.fn(),
        setFilePath: jest.fn(),
      };

      useJSONFileMock.mockImplementationOnce(() => mockedConf);

      createResource("config.json");

      await sleep(5);

      expect(mockedConf.setData).toHaveBeenCalledTimes(1);
      expect(mockedConf.setData).toHaveBeenCalledWith({
        url: UNDEFINED_VALUE,
        title: UNDEFINED_VALUE,
        chapterNumber: -1,
        hash: UNDEFINED_VALUE,
        images: [],

        loadingFinished: false,
        updatedAtUTC: expect.any(Number),
        createdAtUTC: expect.any(Number),
      });
    });
  });
});
