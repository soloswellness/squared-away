import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://open-book-estimate.vercel.app"),
  title: {
    default: "Squared Away — Transparent Job Quotes",
    template: "%s · Squared Away",
  },
  description:
    "A transparent job-cost calculator for contractors and homeowners: materials, labor, business costs, and profit — every dollar shown, nothing hidden.",
  applicationName: "Squared Away",
  openGraph: {
    title: "Squared Away — Transparent Job Quotes",
    description: "Every dollar of your quote, shown. Materials, labor, business costs, and profit — broken down, not buried.",
    siteName: "Squared Away",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Squared Away — Transparent Job Quotes",
    description: "Every dollar of your quote, shown.",
  },
};

export const viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
