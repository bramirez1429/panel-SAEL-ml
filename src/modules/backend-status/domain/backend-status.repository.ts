import type { BackendStatus } from "./backend-status.model";

export interface BackendStatusRepository {
  getStatus(): Promise<BackendStatus>;
}
