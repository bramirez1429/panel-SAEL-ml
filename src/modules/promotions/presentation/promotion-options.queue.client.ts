"use client";

type QueueTask = () => Promise<void>;

const MAX_CONCURRENT_LOADS = 3;
const pendingTasks: QueueTask[] = [];
let activeLoads = 0;

export function enqueuePromotionOptionsLoad(task: QueueTask): void {
  pendingTasks.push(task);
  runPendingTasks();
}

function runPendingTasks(): void {
  while (activeLoads < MAX_CONCURRENT_LOADS) {
    const task = pendingTasks.shift();
    if (!task) return;
    activeLoads += 1;
    void task().finally(() => {
      activeLoads -= 1;
      runPendingTasks();
    });
  }
}
