import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Pawn Broker",
  description: "Mini pawn broker loan module",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header>
            <h1>Pawn Broker</h1>
            <nav>
              <Link href="/">Loans</Link>
              <Link href="/loans/new">New Loan</Link>
              <Link href="/day-book">Day Book</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
