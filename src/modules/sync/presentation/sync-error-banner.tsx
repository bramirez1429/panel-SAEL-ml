import { Alert } from "antd";
import Link from "next/link";

export function SyncErrorBanner({
  count,
  syncId,
}: Readonly<{
  count: number;
  syncId?: string | null;
}>) {
  if (count <= 0) return null;
  const href = syncId
    ? `/sincronizacion?syncId=${encodeURIComponent(syncId)}`
    : "/sincronizacion";

  return (
    <Alert
      action={<Link href={href}>Revisar</Link>}
      title={`${count} publicaciones necesitan revisión`}
      showIcon
      type="warning"
    />
  );
}
