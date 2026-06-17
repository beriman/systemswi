// Email Inbox Page for SWI
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  labelIds: string[];
};

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [sourceStatus, setSourceStatus] = useState<"live" | "blocked">("live");

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ max: "25" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/email?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok && data.sourceStatus !== "blocked") throw new Error(data.error || "Failed");
      setEmails(data.messages || []);
      setSourceStatus(data.sourceStatus || "live");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">📧 Email Inbox</h2>
          <p className="text-muted-foreground">sensasiwangi.id@gmail.com — via Gmail API</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchEmails} disabled={loading} variant="outline" size="sm">
            🔄 Refresh
          </Button>
        </div>
      </div>

      {sourceStatus === "blocked" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-3 text-yellow-700 text-sm">
            ⚠️ Gmail OAuth tidak valid. Perlu re-auth untuk akses email.
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Cari email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchEmails()}
          className="max-w-md"
        />
        <Button onClick={fetchEmails} disabled={loading}>
          {loading ? "⏳" : "🔍"}
        </Button>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">📬 Inbox ({emails.length})</TabsTrigger>
          <TabsTrigger value="read">📖 Read</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? "Tidak ada email yang cocok." : "Inbox kosong."}
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <Card
                  key={email.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEmail?.id === email.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {email.from.replace(/<.*>/, "").trim() || email.from}
                          </span>
                          {email.labelIds?.includes("UNREAD") && (
                            <Badge className="bg-blue-500 text-white text-[10px] h-4">NEW</Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium truncate">{email.subject}</div>
                        <div className="text-xs text-muted-foreground truncate">{email.snippet}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(email.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="read">
          {selectedEmail ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                <CardDescription>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-muted-foreground">From:</span> {selectedEmail.from}</div>
                    <div><span className="text-muted-foreground">To:</span> {selectedEmail.to}</div>
                    <div><span className="text-muted-foreground">Date:</span> {new Date(selectedEmail.date).toLocaleString("id-ID")}</div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4">
                  {selectedEmail.snippet || "(Email body not loaded in list view)"}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Pilih email untuk dibaca
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
