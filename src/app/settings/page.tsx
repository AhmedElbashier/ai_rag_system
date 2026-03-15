"use client";

import TopNav from "@/components/TopNav";
import { useState } from "react";
import { User, Key, Bell, Shield, Database, Trash2, Copy, RefreshCw, Check } from "lucide-react";

const sections = [
  { id: "profile",     icon: User,     label: "Profile" },
  { id: "api-keys",    icon: Key,      label: "API Keys" },
  { id: "storage",     icon: Database, label: "Storage" },
  { id: "security",    icon: Shield,   label: "Security" },
  { id: "notifications", icon: Bell,   label: "Notifications" },
];

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-white/[0.05] last:border-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-white/80">{label}</p>
        {description && <p className="text-xs text-white/35">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="relative w-10 h-5.5 rounded-full transition-colors"
      style={{
        background: on ? "oklch(0.55 0.18 160 / 0.80)" : "oklch(1 0 0 / 0.12)",
        border: on ? "1px solid oklch(0.65 0.18 160 / 0.50)" : "1px solid oklch(1 0 0 / 0.12)",
        height: "22px",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

function ApiKeyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const masked = value.slice(0, 10) + "•".repeat(24) + value.slice(-4);
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-xs text-white/30 font-mono mt-0.5">{masked}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", color: "oklch(0.60 0 0)" }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[oklch(0.65_0.18_160)]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", color: "oklch(0.60 0 0)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "oklch(0.14 0.005 240 / 0.55)",
  border: "1px solid oklch(1 0 0 / 0.07)",
  backdropFilter: "blur(12px)",
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  return (
    <div className="min-h-screen bg-[oklch(0.10_0_0)] text-white dark flex flex-col">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[oklch(0.10_0_0)]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.55_0.06_280/0.05)] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.70 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <TopNav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-14">
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-white/40">Manage your account, API keys, and preferences.</p>
        </div>

        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden md:flex flex-col gap-1 w-44 shrink-0">
            {sections.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors"
                style={
                  activeSection === id
                    ? { background: "oklch(1 0 0 / 0.07)", color: "white" }
                    : { color: "oklch(0.55 0 0)" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="flex-1 space-y-6 min-w-0">

            {activeSection === "profile" && (
              <div className="rounded-xl p-6 space-y-0" style={cardStyle}>
                <h2 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-widest text-xs">Profile</h2>
                <SettingRow label="Display name" description="Shown in the chat workspace">
                  <input
                    defaultValue="John Doe"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/[0.08] text-white/80 outline-none focus:border-white/20 w-40"
                  />
                </SettingRow>
                <SettingRow label="Email" description="Used for login and notifications">
                  <input
                    defaultValue="john@acme.com"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/[0.08] text-white/80 outline-none focus:border-white/20 w-48"
                  />
                </SettingRow>
                <SettingRow label="Plan" description="Your current subscription">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "oklch(0.55 0.18 160 / 0.15)", color: "oklch(0.72 0.18 160)", border: "1px solid oklch(0.65 0.18 160 / 0.25)" }}>
                    Pro
                  </span>
                </SettingRow>
                <div className="pt-4">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: "oklch(0.55 0.18 160 / 0.18)", border: "1px solid oklch(0.65 0.18 160 / 0.30)" }}
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === "api-keys" && (
              <div className="rounded-xl p-6 space-y-0" style={cardStyle}>
                <h2 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">API Keys</h2>
                <ApiKeyRow label="Production key" value="sk_live_••••••••••••••••••••••••••••" />
                <ApiKeyRow label="Development key" value="sk_test_••••••••••••••••••••••••••••" />
                <div className="pt-4">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: "oklch(0.55 0.18 160 / 0.18)", border: "1px solid oklch(0.65 0.18 160 / 0.30)" }}
                  >
                    Generate new key
                  </button>
                </div>
              </div>
            )}

            {activeSection === "storage" && (
              <div className="rounded-xl p-6 space-y-0" style={cardStyle}>
                <h2 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Storage</h2>
                {/* Storage usage bar */}
                <div className="py-4 border-b border-white/[0.05] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Storage used</span>
                    <span className="text-white/80 font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-white/[0.06]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "24%",
                        background: "linear-gradient(90deg, oklch(0.60 0.18 160), oklch(0.75 0.16 168))",
                      }}
                    />
                  </div>
                </div>
                <SettingRow label="Auto-delete old files" description="Remove documents older than 90 days">
                  <Toggle />
                </SettingRow>
                <SettingRow label="Compress uploads" description="Reduce storage usage for large PDFs">
                  <Toggle defaultOn />
                </SettingRow>
                <div className="pt-4">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "oklch(0.70 0.22 30 / 0.12)", border: "1px solid oklch(0.70 0.22 30 / 0.25)", color: "oklch(0.70 0.22 30)" }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all documents
                  </button>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="rounded-xl p-6 space-y-0" style={cardStyle}>
                <h2 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Security</h2>
                <SettingRow label="Two-factor authentication" description="Secure your account with 2FA">
                  <Toggle />
                </SettingRow>
                <SettingRow label="Session timeout" description="Auto-logout after inactivity">
                  <select className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/[0.08] text-white/70 outline-none">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </SettingRow>
                <SettingRow label="API rate limiting" description="Limit requests per minute per key">
                  <Toggle defaultOn />
                </SettingRow>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="rounded-xl p-6 space-y-0" style={cardStyle}>
                <h2 className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Notifications</h2>
                <SettingRow label="Upload complete" description="Email when a document finishes processing">
                  <Toggle defaultOn />
                </SettingRow>
                <SettingRow label="Storage warning" description="Alert when you reach 80% storage">
                  <Toggle defaultOn />
                </SettingRow>
                <SettingRow label="API usage alerts" description="Notify when approaching rate limits">
                  <Toggle />
                </SettingRow>
                <SettingRow label="Product updates" description="New features and improvements">
                  <Toggle />
                </SettingRow>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
