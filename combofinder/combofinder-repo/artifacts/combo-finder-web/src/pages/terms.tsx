export default function Terms() {
  return (
    <div className="min-h-screen px-5 py-10 max-w-2xl mx-auto"
      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
        <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          ComboFinder · combofinder.iunlockd.com · Last updated: July 2025
        </p>
      </div>

      <div className="space-y-7 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>1. Acceptance of Terms</h2>
          <p>
            By creating an account or using ComboFinder, you agree to these Terms of Service.
            If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>2. Description of Service</h2>
          <p>
            ComboFinder is a business management tool for mobile phone repair technicians. It provides
            features including repair tracking, inventory management, customer records, invoicing,
            compatibility lookup, and optional cloud backup via Google Drive.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>3. Account Registration</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate information when creating your account.</li>
            <li>You are responsible for maintaining the confidentiality of your password.</li>
            <li>You must be at least 18 years old to use this service.</li>
            <li>One person or business may not create multiple accounts to circumvent subscription limits.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>4. Free and Pro Plans</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Free plan:</strong> Data is stored locally on your device. You may optionally back up to Google Drive.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Pro plan:</strong> Data is synced to our secure servers, enabling access from multiple devices.</li>
            <li>Subscription fees are non-refundable unless required by applicable law.</li>
            <li>We reserve the right to change pricing with reasonable notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>5. Google Drive Integration</h2>
          <p className="mb-2">
            When you connect Google Drive, you grant ComboFinder permission to create and manage
            a single backup file (<code className="text-xs px-1 py-0.5 rounded" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>combofinder-backup.json</code>) in your Drive.
            We will not access any other files. You can revoke this access at any time from Settings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>6. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Use the service for any unlawful purpose.</li>
            <li>Attempt to access other users' accounts or data.</li>
            <li>Reverse-engineer, copy, or redistribute the application.</li>
            <li>Upload malicious code or attempt to disrupt the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>7. Data and Backups</h2>
          <p>
            We make reasonable efforts to maintain data integrity for Pro plan users. However,
            we strongly recommend keeping regular exports of your data. We are not liable for
            data loss resulting from technical failures, accidental deletion, or account termination.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>8. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
            You may delete your account at any time by contacting us. Upon termination,
            your data will be deleted from our servers within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>9. Limitation of Liability</h2>
          <p>
            ComboFinder is provided "as is" without warranties of any kind. We are not liable
            for any indirect, incidental, or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>10. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. We will notify users of significant changes
            via email or an in-app notice. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2" style={{ color: "hsl(var(--foreground))" }}>11. Contact</h2>
          <p>
            For questions about these terms, contact us at:{" "}
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
