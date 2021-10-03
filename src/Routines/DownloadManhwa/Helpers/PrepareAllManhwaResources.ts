import type { Resource } from "@Data/Resource/CreateResource";
import { error, result } from "error-result";

import { downloadResource } from "@Routines/DownloadResource/DownloadResource";
import { checkResultsListForErrors } from "@Utils/CheckResultsListForErrors";
import { Logger } from "@Utils/Logger";

import type { Result } from "error-result";
import type { Manhwa } from "@Data/Manhwa/CreateManhwaEntry";
export async function prepareAllManhwaResources(manhwa: Manhwa) {
  const { availableResources, unavailableResources } = manhwa.getResources();

  const resourceDownloadProcesses: Array<Promise<Result<Resource>>> = [];

  for (const index of unavailableResources.keys()) {
    const resRef = unavailableResources[index];
    const process = downloadResource(resRef.url, index);
    resourceDownloadProcesses.push(process);
  }

  Logger.debug("Starting download processes.");

  const processErrors = await checkResultsListForErrors(
    resourceDownloadProcesses
  );

  if (processErrors) {
    return error(processErrors);
  }

  Logger.debug("Waiting for available resources.");

  const initialLocalResourcesErrors = await checkResultsListForErrors(
    availableResources.map((r) => r.wait())
  );

  if (initialLocalResourcesErrors) {
    return error(initialLocalResourcesErrors);
  }

  const localResources = manhwa.getResources().availableResources;

  Logger.debug("Waiting for all.");

  const localResourcesErrors = await checkResultsListForErrors(
    localResources.map((r) => r.wait())
  );

  if (localResourcesErrors) {
    return error(localResourcesErrors);
  }

  return result(localResources);
}
