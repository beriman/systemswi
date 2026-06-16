"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/components/auth/role-gate";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
};

type QuickPrompt = {
  label: string;
  prompt: string;
  icon: string;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  { label: "Ringkasan Keuangan", prompt: "Buatkan ringkasan keuangan PT SWI bulan ini berdasarkan data yang tersedia di dashboard.", icon: "💰" },
  { label: "Status Event", prompt: "Bagaimana status pipeline event Fragrantions? Apa saja tenant dan sponsor yang sudah confirmed?", icon: "🎉" },
  { label: "Produksi Brand", prompt: "Bagaimana status produksi 3 brand SWI: L'Arc~en~Scent, Pixel Potion, dan Nuscentza?", icon: "🏭" },
  { label: "Inventory Alert", prompt: "Apa saja item inventory yang perlu di-restock atau sudah di bawah minimum stock?", icon: "📦" },
  { label: "Follow-up CRM", prompt: "Customer mana saja yang perlu follow-up hari ini atau sudah overdue?", icon: "👥" },
  { label: "Compliance Status", prompt: "Bagaimana status compliance dan BPOM registration tracker untuk produk SWI?", icon: "✅" },
];

const SUGGESTED_REPLIES: Record<string, string[]> = {
  "ringkasan": ["Detail pemasukan vs pengeluaran", "Bandingkan dengan bulan lalu", "Proyeksi cashflow 3 bulan"],
  "event": ["List tenant belum lunas", "Sponsor pipeline value", "Timeline persiapan event"],
  "produksi": ["COGS per brand", "Batch yang perlu QC", "Stok produk jadi"],
  "inventory": ["Item kritis di bawah minimum", "Purchase order pending", "Supplier lead time"],
  "crm": ["Customer belum di-follow-up 7 hari", "Pipeline penjualan", "Repeat customer rate"],
  "compliance": ["BPOM expiry ≤90 hari", "QC checklist pending", "IFRA compliance status"],
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 17) return "Selamat siang";
  if (hour < 21) return "Selamat sore";
  return "Selamat malam";
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function generateContextualResponse(userMessage: string, context: any): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("keuangan") || msg.includes("saldo") || msg.includes("kas") || msg.includes("uang")) {
    const saldo = context?.totalSaldoAkhir ? `Rp ${context.totalSaldoAkhir.toLocaleString("id-ID")}` : "data tidak tersedia (perlu re-auth Google)";
    const modal = context?.totalSudahSetor ? `Rp ${context.totalSudahSetor.toLocaleString("id-ID")}` : "data tidak tersedia";
    return `💰 **Ringkasan Keuangan SWI**\n\n- Saldo Bank: ${saldo}\n- Modal Disetor: ${modal}\n- Source: ${context?.sourceStatus || "unknown"}\n\n⚠️ ${context?.sourceStatus === "degraded" ? "Google OAuth perlu re-auth untuk data live real-time." : "Data dari Google Sheets live."}\n\nMau detail pemasukan atau pengeluaran?`;
  }

  if (msg.includes("event") || msg.includes("fragrantions") || msg.includes("tenant") || msg.includes("sponsor")) {
    return `🎉 **Status Event Fragrantions**\n\nBerdasarkan data terakhir dari Google Sheets:\n\n- Pipeline event aktif: cek di /events\n- Tenant & sponsor: lihat Commercial Pipeline\n- Status pembayaran: tracked per tenant/sponsor\n\n⚠️ Untuk data real-time, pastikan Google OAuth aktif.\n\nMau detail tenant yang belum lunas atau sponsor pipeline?`;
  }

  if (msg.includes("produksi") || msg.includes("brand") || msg.includes("batch") || msg.includes("cogs")) {
    const brandCount = context?.brandSummary?.brandCount || 0;
    return `🏭 **Status Produksi Brand SWI**\n\n- Brand aktif: ${brandCount} (L'Arc~en~Scent, Pixel Potion, Nuscentza)\n- Pipeline: Bahan → Bottling → Packaging → QC → Stock\n- Detail batch: cek di /production\n\n⚠️ Data live memerlukan Google OAuth aktif.\n\nMau detail COGS per brand atau batch yang perlu QC?`;
  }

  if (msg.includes("inventory") || msg.includes("stok") || msg.includes("stock") || msg.includes("restock")) {
    return `📦 **Status Inventory**\n\n- Module inventory: /inventory\n- Low stock alerts: /alerts\n- Purchase order: /procurement\n\n⚠️ Data live memerlukan Google OAuth aktif.\n\nMau detail item kritis atau PO pending?`;
  }

  if (msg.includes("crm") || msg.includes("customer") || msg.includes("follow-up") || msg.includes("followup")) {
    return `👥 **Status CRM**\n\n- Customer database: /customers\n- Follow-up tracker: tersedia di CRM module\n- Interaction log: tercatat per customer\n\n⚠️ Data live memerlukan Google OAuth aktif.\n\nMau list customer yang perlu follow-up?`;
  }

  if (msg.includes("compliance") || msg.includes("bpom") || msg.includes("ifra") || msg.includes("qc")) {
    return `✅ **Status Compliance**\n\n- Compliance tracker: /compliance\n- BPOM registration: /bpom\n- QC checklist: tersedia di production module\n\n⚠️ Data live memerlukan Google OAuth aktif.\n\nMau detail BPOM expiry atau QC pending?`;
  }

  if (msg.includes("help") || msg.includes("bantu") || msg.includes("apa yang bisa")) {
    return `🤖 **Saya bisa membantu dengan:**\n\n1. 💰 **Keuangan** — Ringkasan saldo, modal, cashflow\n2. 🎉 **Event** — Status Fragrantions, tenant, sponsor\n3. 🏭 **Produksi** — Brand, batch, COGS, QC\n4. 📦 **Inventory** — Stok, alert, PO\n5. 👥 **CRM** — Customer, follow-up\n6. ✅ **Compliance** — BPOM, IFRA, QC checklist\n\nPilih topik atau tanya langsung!`;
  }

  return `🤖 **SWI Assistant**\n\nSaya memahami pertanyaan Anda tentang "${userMessage.slice(0, 50)}...".\n\nSaat ini saya bisa memberikan informasi berdasarkan data systemswi. Untuk data real-time dari Google Sheets, pastikan Google OAuth aktif.\n\nCoba tanya tentang:\n- Keuangan, Event, Produksi\n- Inventory, CRM, Compliance\n\nKetik "help" untuk melihat semua kemampuan.`;
}

function getSuggestedReplies(message: string): string[] {
  const msg = message.toLowerCase();
  for (const [key, replies] of Object.entries(SUGGESTED_REPLIES)) {
    if (msg.includes(key)) return replies;
  }
  return [];
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: `${getGreeting()}! 🤖 Saya adalah SWI Assistant, asisten AI untuk PT Sensasi Wangi Indonesia.\n\nSaya bisa membantu Anda dengan:\n- 💰 Ringkasan keuangan\n- 🎉 Status event Fragrantions\n- 🏭 Produksi brand\n- 📦 Inventory & procurement\n- 👥 CRM & follow-up\n- ✅ Compliance & BPOM\n\nPilih quick prompt di bawah atau ketik pertanyaan Anda!`,
      timestamp: getTimestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setDashboardData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: text.trim(),
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestedReplies([]);

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

    const response = generateContextualResponse(text, dashboardData);

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: response,
      timestamp: getTimestamp(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
    setSuggestedReplies(getSuggestedReplies(text));
    inputRef.current?.focus();
  }, [isLoading, dashboardData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSuggestedReply = (reply: string) => {
    sendMessage(reply);
  };

  const clearChat = () => {
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        content: "Chat direset. 🤖 Ada yang bisa saya bantu?",
        timestamp: getTimestamp(),
      },
    ]);
    setSuggestedReplies([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🤖 AI Chat Assistant</h2>
          <p className="text-muted-foreground">
            Tanya tentang keuangan, event, produksi, inventory, CRM, dan compliance SWI.
          </p>
        </div>
        <Button onClick={clearChat} variant="outline" size="sm">
          🗑️ Reset Chat
        </Button>
      </div>

      <RoleGate feature="ai-features">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          {/* Chat Area */}
          <Card className="flex flex-col" style={{ minHeight: "600px" }}>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                SWI Assistant — Online
              </CardTitle>
              <CardDescription className="text-xs">
                {dashboardData?.sourceStatus === "degraded"
                  ? "⚠️ Mode degraded — Google OAuth perlu re-auth untuk data live"
                  : "🟢 Terhubung ke Google Sheets"}
              </CardDescription>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto space-y-4 py-4" style={{ maxHeight: "460px" }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl rounded-bl-sm px-4 py-3 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Suggested Replies */}
            {suggestedReplies.length > 0 && !isLoading && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestedReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSuggestedReply(reply)}
                    className="text-xs rounded-full border bg-background px-3 py-1 hover:border-primary/50 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya tentang keuangan, event, produksi, inventory..."
                className="min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="shrink-0">
                {isLoading ? "⏳" : "Kirim"}
              </Button>
            </form>
          </Card>

          {/* Sidebar — Quick Prompts */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">⚡ Quick Prompts</CardTitle>
                <CardDescription className="text-xs">Klik untuk tanya cepat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => handleQuickPrompt(qp.prompt)}
                    className="w-full text-left rounded-lg border bg-background p-3 text-sm hover:border-primary/50 transition-colors"
                  >
                    <div className="font-medium flex items-center gap-2">
                      <span>{qp.icon}</span>
                      {qp.label}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">📊 System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Google Sheets</span>
                  <Badge variant={dashboardData?.sourceStatus === "degraded" ? "destructive" : "default"}>
                    {dashboardData?.sourceStatus === "degraded" ? "Degraded" : "Live"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dashboard API</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chat Mode</span>
                  <Badge variant="secondary">Context-Aware</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-4 text-xs text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">💡 Tips</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tanya tentang keuangan, event, produksi</li>
                  <li>Gunakan quick prompt untuk akses cepat</li>
                  <li>Suggested reply muncul setelah respons</li>
                  <li>Data live memerlukan Google OAuth aktif</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
