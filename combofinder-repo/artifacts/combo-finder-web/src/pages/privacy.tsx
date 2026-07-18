export default function Privacy() {
  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto"
      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          ComboFinder · combofinder.iunlockd.com · Last updated: July 2025
        </p>
      </div>

      <div className="space-y-7 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>1. Overview</h2>
          <p>
            ComboFinder is a tool for mobile phone repair technicians. We take your privacy seriously.
            This policy explains what data we collect, how we use it, and how we protect it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Account info:</strong> Name, email address, and phone number when you register.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Business data:</strong> Inventory, customers, repairs, invoices, and expenses you enter into the app.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Free plan:</strong> Your data is stored locally on your device only — it is never sent to our servers.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Pro plan:</strong> Your data is stored securely in our database to enable cross-device sync.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>3. Google Drive Integration</h2>
          <p className="mb-2">
            Free plan users may optionally connect their Google Drive account to back up their data.
            Here is exactly what we do and do not do with Google Drive:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We request the <strong style={{ color: "hsl(var(--foreground))" }}>drive.file</strong> scope only — this gives us access exclusively to files that ComboFinder itself creates.</li>
            <li>We create and manage a single file: <code className="text-xs px-1 py-0.5 rounded" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>combofinder-backup.json</code> in your Google Drive.</li>
            <li>We <strong style={{ color: "hsl(var(--foreground))" }}>cannot read, access, or modify</strong> any other files in your Google Drive.</li>
            <li>Your backup file contains only your own ComboFinder data (inventory, customers, etc.).</li>
            <li>We do not share, sell, or transmit your Drive data to any third party.</li>
            <li>You can disconnect Google Drive at any time from the Settings page. We will immediately stop all Drive access.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>4. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To provide and improve the ComboFinder service.</li>
            <li>To restore your data when you log in on a new device (Pro plan) or restore from backup (Free plan).</li>
            <li>We do not sell your data to third parties.</li>
            <li>We do not use your data for advertising.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>5. Data Security</h2>
          <p>
            Pro plan data is stored in a secure PostgreSQL database with encrypted connections.
            Free plan data stays on your device. Google Drive backups are stored in your own Google account
            and protected by Google's security infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>6. Data Deletion</h2>
          <p>
            You can delete your account and all associated data at any time by contacting us.
            For Free plan users, clearing your browser/app data removes all local data.
            Disconnecting Google Drive from Settings stops all future backups.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>7. Contact</h2>
          <p>
            If you have any questions about this privacy policy, please contact us at:{" "}
            <a href="mailto:support@iunlockd.com" className="font-medium"
              style={{ color: "hsl(var(--primary))" }}>support@iunlockd.com</a>
          </p>
        </section>

      </div>

      <div className="mt-10 pt-6 border-t text-xs text-center"
        style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
        © {new Date().getFullYear()} ComboFinder · iunlockd.com
      </div>
    </div>
  );
}
