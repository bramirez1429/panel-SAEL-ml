import { UsersView } from "@/modules/users/presentation/users.server";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <div data-dashboard-full-width="true">
      <UsersView />
    </div>
  );
}

