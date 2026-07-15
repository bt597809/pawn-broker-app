import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { userService } from "@/services/userService";
import UserAdminPanel from "./UserAdminPanel";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await userService.list();

  return (
    <div>
      <div className="card">
        <h2>Users</h2>
        <p className="muted">Admin only — create staff and disable logins.</p>
      </div>
      <UserAdminPanel initialUsers={users} currentUserId={user.userId} />
    </div>
  );
}
