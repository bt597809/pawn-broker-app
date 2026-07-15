import Link from "next/link";
import { customerService } from "@/services/customerService";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q || "";
  const customers = await customerService.list({ q });

  return (
    <div>
      <div className="card">
        <h2>Customers</h2>
        <p>
          <Link href="/customers/new">Add customer</Link>
        </p>
        <form method="get" style={{ marginTop: 12 }}>
          <div className="grid">
            <label>
              Search
              <input
                name="q"
                defaultValue={q}
                placeholder="Name, phone, ID proof, address"
              />
            </label>
          </div>
          <p style={{ marginTop: 12 }}>
            <button type="submit">Search</button>{" "}
            <Link href="/customers">Clear</Link>
          </p>
        </form>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>ID proof</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && (
            <tr>
              <td colSpan={4}>No customers match the filter.</td>
            </tr>
          )}
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.phone || "—"}</td>
              <td>
                {c.idProofType || "—"}
                {c.idProofNo ? ` ${c.idProofNo}` : ""}
              </td>
              <td>{c.address || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
