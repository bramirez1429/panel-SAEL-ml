import type { BackendStatus } from "../domain/backend-status.model";
import type { BackendStatusRepository } from "../domain/backend-status.repository";

export class GetBackendStatusQuery {
  constructor(private readonly repository: BackendStatusRepository) {}

  execute(): Promise<BackendStatus> {
    return this.repository.getStatus();
  }
}
