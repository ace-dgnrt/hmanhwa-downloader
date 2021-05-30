import { Logger } from "../../utils/Logger";
import { initTaskStatus, TaskStatus } from "./TaskStatus";

type TaskSubcribeMethod<T> = (
  params:
    | { status: TaskStatus.Finished; data: T }
    | { status: TaskStatus.Failed | TaskStatus.InProgress }
) => void;

interface TaskInterface<T> {
  status: TaskStatus;
  data: T | undefined;
  subscribe(fn: TaskSubcribeMethod<T>): void;
  retry(): void;
}

export function Task<T, ARGS extends unknown[]>(params: {
  promise: (...args: ARGS) => Promise<T>;
  arguments: ARGS;
}): TaskInterface<T> {
  const status = initTaskStatus();
  let taskPromise: Promise<T>;
  let data: T | undefined = undefined;

  const startPromise = () => {
    taskPromise = params.promise(...params.arguments);

    taskPromise
      .then((d) => {
        data = d;
        status.setFinished();
      })
      .catch((e) => {
        Logger.warning("Task failed", params.arguments);
        status.setFailed();
      });
  };

  const retry = () => {
    if (status.value === TaskStatus.Failed) {
      startPromise();
    } else {
      status.forceOnChange();
    }
  };

  startPromise();
  return {
    status: status.value,
    data,
    retry,
    subscribe(fn) {
      status.onChange = () => {
        if (status.value === TaskStatus.Finished) {
          return fn({ status: status.value, data: data! });
        }
        return fn({ status: status.value });
      };
    },
  };
}
