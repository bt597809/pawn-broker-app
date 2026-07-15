"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string | Date;
};

export default function UserAdminPanel({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [users, setUsers] = useState(initialUsers);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to create user");
      return;
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
    setUsers((prev) => [json.data, ...prev]);
  }

  async function toggleActive(id: number, active: boolean) {
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Update failed");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)));
    router.refresh();
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Active" : "Disabled"}</td>
              <td>
                {u.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => toggleActive(u.id, !u.active)}
                  >
                    {u.active ? "Disable" : "Enable"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Create user</h3>
        <form onSubmit={handleCreate}>
          <div className="grid">
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength={6} required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="CASHIER">
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
          </div>
          <p style={{ marginTop: 12 }}>
            <button type="submit">Create user</button>
          </p>
        </form>
      </div>
    </div>
  );
}
