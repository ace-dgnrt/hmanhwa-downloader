import { TrackedObject } from "../../utils/TrackedObject/TrackedObject";

export enum TaskStatus {
  InProgress,
  Finished,
  Failed,
}

export function initTaskStatus() {
  const current = TrackedObject(TaskStatus.InProgress);
  return {
    value: current.value,
    onChange(fn: (status: TaskStatus) => void) {
      current.onChange = () => fn(current.value);
    },
    setFinished() {
      current.value = TaskStatus.Finished;
    },
    setFailed() {
      current.value = TaskStatus.Failed;
    },
    forceOnChange() {
      current.onChange();
    },
  };
}
