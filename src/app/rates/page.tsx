import { goldRateService } from "@/services/goldRateService";
import { fromPaise } from "@/lib/money";
import GoldRateForm from "./GoldRateForm";

export const dynamic = "force-dynamic";

export default async function GoldRatesPage() {
  const [latest, history] = await Promise.all([
    goldRateService.listLatest(),
    goldRateService.listHistory(15),
  ]);

  return (
    <div>
      <div className="card">
        <h2>Metal rate master</h2>
        <p className="muted">Set today’s gold/silver rate. New loan form auto-fills the latest rate.</p>
        <div className="grid" style={{ marginTop: 12 }}>
          {latest.length === 0 && <p>No rates set yet.</p>}
          {latest.map((r) => (
            <p key={r.id}>
              <strong>{r.metalType}</strong>: {fromPaise(r.ratePerGramPaise).toFixed(2)} / gm
              <br />
              <span className="muted">
                as of {r.effectiveDate.toISOString().slice(0, 10)}
                {r.createdBy ? ` · ${r.createdBy.name}` : ""}
              </span>
            </p>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Update rate</h3>
        <GoldRateForm />
      </div>

      <div className="card">
        <h3>Recent rates</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Metal</th>
              <th>Rate / gm</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {history.map((r) => (
              <tr key={r.id}>
                <td>{r.effectiveDate.toISOString().slice(0, 10)}</td>
                <td>{r.metalType}</td>
                <td>{fromPaise(r.ratePerGramPaise).toFixed(2)}</td>
                <td>{r.createdBy?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
