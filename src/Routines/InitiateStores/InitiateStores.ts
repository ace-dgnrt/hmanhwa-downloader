import { InitiateManhwaStore } from "@Routines/InitiateStores/InitiateManhwaStore";
import { initiateResourceStore } from "@Routines/InitiateStores/InitiateResourceStore";
import { initiateSharedDirectory } from "@Routines/InitiateStores/InitiateSharedDirectory";

export function initiateStores() {
  initiateResourceStore();
  InitiateManhwaStore();
  initiateSharedDirectory();
}
