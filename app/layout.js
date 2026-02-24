import './globals.css';

export const metadata = {
  title: 'SOC TicketOps Platform',
  description: 'No-code SIEM integrated SOC ticket platform'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <div className="bg-orb one" />
          <div className="bg-orb two" />
          <div className="container">{children}</div>
        </div>
      </body>
    </html>
  );
}
