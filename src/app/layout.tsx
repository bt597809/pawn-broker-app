import "./globals.css";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export const metadata = {
  title: "Pawn Broker",
  description: "Indian shop pawn broker module",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header>
            <h1>Pawn Broker</h1>
            {user ? (
              <nav>
                <Link href="/">Loans</Link>
                <Link href="/loans/new">New Loan</Link>
                <Link href="/customers">Customers</Link>
                <Link href="/schemes">Schemes</Link>
                <Link href="/day-book">Day Book</Link>
                {user.role === "ADMIN" && <Link href="/users">Users</Link>}
                <span className="muted" style={{ marginLeft: 8 }}>
                  {user.name} ({user.role})
                </span>
                <LogoutButton />
              </nav>
            ) : null}
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
