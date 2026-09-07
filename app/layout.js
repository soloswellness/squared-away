import "./globals.css";

export const metadata = {
  title: "Squared Away",
  description: "A transparent job-cost calculator for contractors and homeowners.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
