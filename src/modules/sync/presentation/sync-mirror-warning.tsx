import { Alert } from "antd";

import { getMirrorSyncWarning } from "../application/sync-progress";
import type { MirrorWriteResult } from "../domain/sync.model";

export function SyncMirrorWarning({ result }: Readonly<{ result: MirrorWriteResult }>) {
  const warning = getMirrorSyncWarning(result);
  return warning ? <Alert title={warning} showIcon type="warning" /> : null;
}
