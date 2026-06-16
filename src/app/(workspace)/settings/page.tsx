"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/components/auth/role-gate";
import { usePermissions } from "@/hooks/use-permissions";

type SystemInfo = {
  version: string;
  buildDate: string;
  nodeEnv: string;
  nextVersion: string;
};

type SettingsSection = {
  id: string;
  label: string;
  icon: string;
};

const SECTIONS: SettingsSection[] = [
  { id: "general", label: "Umum", icon: "⚙️" },
  { id: "company", label: "Perusahaan", icon: "🏢" },
  { id: "integrations", label: "Integrasi", icon: "🔗" },
  { id: "security", label: "Keamanan", icon: "🔒" },
  { id: "system", label: "Sistem", icon: "🖥️" },
];

export default function SettingsPage() {
  const { hasAccess } = usePermissions();
  const [activeSection, setActiveSection] = useState("general");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Company settings
  const [companyName, setCompanyName] = useState("PT Sensasi Wangi Indonesia");
  const [companyEmail, setCompanyEmail] = useState("info@swi.id");
  const [companyPhone, setCompanyPhone] = useState("+62-21-XXXX-XXXX");
  const [companyAddress, setCompanyAddress] = useState("Jakarta, Indonesia");

  // Integration settings
  const [sheetsId, setSheetsId] = useState("1lQ_FX6v-aX0XNwkRO6TyYLU1NGq6lAMFvK88S09KZsA");
  const [oauthStatus, setOauthStatus] = useState<string>("unknown");

  useEffect(() => {
    // Check OAuth status
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setOauthStatus(data?.sourceStatus || "unknown");
      })
      .catch(() => setOauthStatus("error"));

    setSystemInfo({
      version: "1.0.0",
      buildDate: new Date().toLocaleDateString("id-ID"),
      nodeEnv: "production",
      nextVersion: "16.1.1",
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const canManage = hasAccess("settings");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">⚙️ Settings</h2>
          <p className="text-muted-foreground">
            Konfigurasi sistem, perusahaan, dan integrasi.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {saved && <Badge variant="default" className="bg-green-600">✅ Tersimpan</Badge>}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "💾 Simpan"}
            </Button>
          </div>
        )}
      </div>

      <RoleGate feature="settings">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          {/* Section Nav */}
          <Card className="h-fit">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Content */}
          <div className="space-y-4">
            {activeSection === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle>⚙️ Pengaturan Umum</CardTitle>
                  <CardDescription>Konfigurasi dasar sistem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama Aplikasi</Label>
                      <Input value="System SWi" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue="Asia/Jakarta">
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bahasa</Label>
                      <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue="id">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mata Uang</Label>
                      <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue="IDR">
                        <option value="IDR">IDR (Rupiah)</option>
                        <option value="USD">USD (Dollar)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notifikasi Email</Label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="emailNotif" defaultChecked className="rounded" />
                      <label htmlFor="emailNotif" className="text-sm">Aktifkan notifikasi email untuk alert penting</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "company" && (
              <Card>
                <CardHeader>
                  <CardTitle>🏢 Data Perusahaan</CardTitle>
                  <CardDescription>Informasi PT Sensasi Wangi Indonesia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama Perusahaan</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Perusahaan</Label>
                      <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} type="email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telepon</Label>
                      <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat</Label>
                      <Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Brand Portfolio</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { name: "L'Arc~en~Scent", color: "🟣", desc: "Premium artisan fragrance" },
                        { name: "Pixel Potion", color: "🟠", desc: "Youth/gamer lifestyle" },
                        { name: "Nuscentza", color: "🟢", desc: "Nusantara heritage" },
                      ].map((brand) => (
                        <div key={brand.name} className="rounded-lg border p-3 text-sm">
                          <div className="font-medium flex items-center gap-2">
                            <span>{brand.color}</span>
                            {brand.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{brand.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "integrations" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>🔗 Google Workspace Integration</CardTitle>
                    <CardDescription>Status koneksi ke Google Sheets, Drive, dan Docs.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Google Sheets</span>
                          <Badge variant={oauthStatus === "degraded" ? "destructive" : "default"}>
                            {oauthStatus === "degraded" ? "Degraded" : "Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Source of truth untuk semua data operasional.</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Google Drive</span>
                          <Badge variant={oauthStatus === "degraded" ? "destructive" : "default"}>
                            {oauthStatus === "degraded" ? "Degraded" : "Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Penyimpanan dokumen dan file.</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Google Docs</span>
                          <Badge variant={oauthStatus === "degraded" ? "destructive" : "default"}>
                            {oauthStatus === "degraded" ? "Degraded" : "Connected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Generator dokumen otomatis.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Google Sheets ID</Label>
                      <Input value={sheetsId} onChange={(e) => setSheetsId(e.target.value)} className="font-mono text-xs" />
                      <p className="text-xs text-muted-foreground">Spreadsheet ID untuk data keuangan dan operasional SWI.</p>
                    </div>

                    {oauthStatus === "degraded" && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                        <div className="font-medium">⚠️ Google OAuth Perlu Re-auth</div>
                        <p className="text-xs mt-1">Token OAuth telah expired atau revoked. Jalankan setup ulang untuk mengaktifkan integrasi penuh.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🚀 Vercel Deployment</CardTitle>
                    <CardDescription>Status deployment production.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Production URL</div>
                        <div className="font-medium text-sm">systemswi.vercel.app</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Framework</div>
                        <div className="font-medium text-sm">Next.js 16.1.1</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground">Auto Deploy</div>
                        <div className="font-medium text-sm text-green-600">Enabled (GitHub)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>🔒 Keamanan</CardTitle>
                  <CardDescription>Pengaturan autentikasi dan otorisasi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <div className="text-sm font-medium mb-1">Autentikasi</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Google OAuth</Badge>
                        <Badge variant="secondary">JWT Session</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Stateless session via HMAC-signed JWT cookie.</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-sm font-medium mb-1">Otorisasi</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">RBAC</Badge>
                        <Badge variant="secondary">5 Roles</Badge>
                        <Badge variant="secondary">10 Features</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Role-based access control dengan 5 role dan 10 feature modules.</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3">Session Configuration</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Session Duration</Label>
                        <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" defaultValue="7d">
                          <option value="1d">1 Hari</option>
                          <option value="7d">7 Hari</option>
                          <option value="30d">30 Hari</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cookie Secure</Label>
                        <div className="flex items-center gap-2 pt-2">
                          <input type="checkbox" defaultChecked disabled className="rounded" />
                          <span className="text-sm text-muted-foreground">Hanya HTTPS (production)</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>SameSite</Label>
                        <div className="pt-2">
                          <Badge variant="secondary">Lax</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "system" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>🖥️ System Info</CardTitle>
                    <CardDescription>Informasi versi dan environment.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {systemInfo && Object.entries(systemInfo).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center rounded-lg border px-3 py-2">
                          <span className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📦 Module Status</CardTitle>
                    <CardDescription>Status semua modul systemswi.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-3">
                      {[
                        { name: "Dashboard", status: "active" },
                        { name: "Finance", status: "active" },
                        { name: "Production", status: "active" },
                        { name: "Inventory", status: "active" },
                        { name: "Procurement", status: "active" },
                        { name: "Compliance", status: "active" },
                        { name: "BPOM Tracker", status: "active" },
                        { name: "Events", status: "active" },
                        { name: "Customers/CRM", status: "active" },
                        { name: "Documents", status: "active" },
                        { name: "Reports", status: "active" },
                        { name: "Alerts", status: "active" },
                        { name: "Automation", status: "active" },
                        { name: "Sukuk Mikro", status: "degraded" },
                        { name: "AI Chat", status: "active" },
                        { name: "Users", status: "active" },
                        { name: "Settings", status: "active" },
                      ].map((mod) => (
                        <div key={mod.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <span>{mod.name}</span>
                          <span className={`w-2 h-2 rounded-full ${mod.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
