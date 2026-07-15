import { getSessionUser } from "@/lib/auth";
import { schemeService } from "@/services/schemeService";
import SchemeForm from "./SchemeForm";

export const dynamic = "force-dynamic";

export default async function SchemesPage() {
  const [schemes, user] = await Promise.all([schemeService.list(), getSessionUser()]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div>
      <div className="card">
        <h2>Loan Schemes</h2>
        <p className="muted">Tenure, rate and LTV used when pledging jewellery.</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Rate % / month</th>
            <th>Tenure (days)</th>
            <th>Max LTV %</th>
            <th>Pre-close</th>
          </tr>
        </thead>
        <tbody>
          {schemes.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.interestRateMonthly}</td>
              <td>{s.tenureDays}</td>
              <td>{s.maxLtvPercent}</td>
              <td>{s.precloseAllowed ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Add scheme (Admin)</h3>
          <SchemeForm />
        </div>
      )}
    </div>
  );
}
