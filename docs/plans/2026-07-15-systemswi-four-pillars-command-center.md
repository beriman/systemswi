# SystemSWI Four Pillars Command Center — Spec v1

**Tanggal:** 2026-07-15  
**Status:** Spec / belum implementasi UI  
**Source utama:** `/home/ubuntu/systemswi`  
**Referensi:** snapshot `systemswi-agent` hanya sebagai referensi ide; tidak di-merge/copy langsung.

---

## 1. Tujuan Dashboard

Membangun **Enterprise Command Center** untuk SystemSWI yang menampilkan kondisi operasional SWI berdasarkan empat pilar resmi:

1. **Media**
2. **Komunitas**
3. **Event**
4. **Retail**

Dashboard ini bertujuan memberi Beriman dan tim SWI satu tempat untuk melihat:

- kesehatan tiap pilar;
- kontribusi finansial dan aktivitas;
- pekerjaan lintas pilar;
- pending approval;
- risiko/blocker;
- status agent/cron;
- GitHub/deployment health;
- next action yang jelas.

Pilar menunjukkan **fokus utama**, bukan silo. Produk/aktivitas boleh berkolaborasi lintas pilar.

---

## 2. User dan Role

| Role | Kebutuhan Utama | Permission Awal |
|---|---|---|
| Direktur / Founder | Executive overview, approval, risiko, profit/loss, strategic priorities | full read, approve high-risk |
| Admin SystemSWI | Input/maintenance data, upload proof, update status | create/update operational records |
| PIC Pilar | Melihat KPI pilar, update task/progress, request approval | scoped create/update |
| Finance | Cashflow, expense, proof, settlement, budget vs actual | finance module read/write |
| Agent Runtime / HemuHemu | Read context, execute safe tasks, report cron status | tool-scoped, audit logged |
| Viewer/Investor future | Ringkasan terbatas, no operational mutation | read-only curated view |

---

## 3. Struktur Informasi

### 3.1 Executive Header

- Total health score SWI
- Cash runway / cash position summary
- Pending approvals count
- Critical risks count
- Last successful cron run
- Latest deployment state

### 3.2 Four Pillars Grid

Setiap pilar memiliki card:

- health status: `green | yellow | red | blocked`
- revenue / income
- expense
- net result / contribution
- active projects
- overdue tasks
- pending approvals
- open risks
- agent recommendation

### 3.3 Cross-Pillar Workstream

Tabel untuk aktivitas lintas pilar, contoh:

| Activity | Primary Pillar | Supporting Pillars | Status | Owner | Risk |
|---|---|---|---|---|---|
| Road to Fragrantions Vol. II | Event | Media, Komunitas, Retail | closeout | Fragrantions | settlement pending |
| SensasiWangi Marketplace | Retail | Media, Komunitas | live | Website/Retail | security watch |
| Material Notes content | Media | Komunitas | active | Media | low |

### 3.4 Approvals & Risks

- Pending expense proof
- Vendor conflict-of-interest review
- Kasbon/settlement outstanding
- Compliance overdue
- Migration or source-of-truth change requests
- Production/security incidents

### 3.5 Agent & Deployment Health

- Hanks SystemSWI latest run
- Hanks sensasiwangi.id latest run
- ETIKA TARIF latest run
- Weekly summary status
- GitHub dirty/ahead/behind status
- Vercel last deployment status

---

## 4. KPI Awal per Pilar

### 4.1 Media

- Published content count
- Content pipeline status
- Asset readiness
- Engagement proxy if available
- Campaign support for Event/Retail
- Brand consistency issues

### 4.2 Komunitas

- Active members / forum activity
- Discussions created
- Replies/comments
- Course/community participation
- Moderation queue
- Community-led event/support activities

### 4.3 Event

- Active events
- Event revenue
- Event expense
- Net event result
- Event closeout completion
- PIC advance/kasbon status
- Sponsor/tenant/partner status

### 4.4 Retail

- Marketplace GMV/order count
- Product/brand count
- Seller/order issues
- Stock/procurement items
- Customer/service tickets
- Security/payment/shipping health

---

## 5. Cross-Pillar Relationships

Data model tidak boleh memaksa satu aktivitas hanya punya satu pilar. Gunakan:

- `primary_pillar`: fokus utama untuk reporting;
- `supporting_pillars`: array/list pilar pendukung;
- `related_entities`: brand, event, product, campaign, task, document;
- `allocation_rules`: optional split biaya/pendapatan jika perlu.

Contoh:

```json
{
  "activity_id": "ACT-RTF2-2026",
  "name": "Road to Fragrantions Vol. II",
  "primary_pillar": "Event",
  "supporting_pillars": ["Media", "Komunitas", "Retail"],
  "related_entities": ["Fragrantions", "RTF Vol. II", "tenant", "portfolio recap"],
  "status": "closeout"
}
```

---

## 6. Project Health

Project health dihitung dari:

- progress task;
- overdue item;
- blocker count;
- verification status;
- latest update age;
- financial proof completeness;
- deployment/runtime health if digital project.

Suggested score:

```text
100 - overdue_penalty - blocker_penalty - stale_update_penalty - risk_penalty
```

Health labels:

| Score | Label |
|---:|---|
| 85-100 | green |
| 65-84 | yellow |
| 40-64 | red |
| <40 | blocked |

---

## 7. Pending Approvals

Approval queue harus menggabungkan:

- expenses needing proof;
- vendor approval / conflict-of-interest;
- budget over threshold;
- finance settlement;
- source-of-truth change;
- production deploy high risk;
- auth/payment/permission changes.

Approval item shape:

```json
{
  "approval_id": "APR-20260715-001",
  "type": "expense_proof",
  "pillar": "Event",
  "amount": 1481823,
  "owner": "Wapiq",
  "risk_level": "medium",
  "status": "pending",
  "required_approver": "Direktur",
  "source_ref": "RTF Vol. II settlement"
}
```

---

## 8. Risk and Blocker View

Risk table fields:

- risk_id
- pillar
- severity
- domain: finance/security/compliance/ops/data/deployment
- description
- owner
- detected_by: human/agent/cron
- first_seen_at
- last_seen_at
- mitigation
- status

Critical examples:

- payment/refund/settlement logic change;
- destructive migration;
- source-of-truth move;
- missing proof for large expense;
- production deploy failed;
- security finding high severity.

---

## 9. Agent/Cron Status

Initial jobs:

| Agent/Cron | Repo | Normal Delivery | KPI |
|---|---|---|---|
| Hanks SystemSWI | `/home/ubuntu/systemswi` | Discord | security findings, safe fixes, clean repo |
| Hanks sensasiwangi.id | `/home/ubuntu/wangi-creations-hub` | Discord | security checks, deployment safety |
| ETIKA TARIF | `/home/ubuntu/systemswi` | Discord | GCG implementation, finance ethics |
| Weekly Hanks Summary | n/a | Telegram | weekly narrative summary |
| Weekly ETIKA TARIF Summary | n/a | Telegram | weekly narrative summary |

Agent status fields:

```json
{
  "agent_id": "hanks-systemswi",
  "cron_id": "5662b163eed5",
  "repo": "/home/ubuntu/systemswi",
  "last_run_at": "2026-07-15T00:00:00+08:00",
  "last_status": "success",
  "model_used": "gpt-5.5",
  "tooling_status": "ok",
  "blocked_reason": null,
  "latest_commit": "...",
  "report_channel": "discord"
}
```

---

## 10. GitHub dan Deployment Health

Per repo:

- current branch;
- clean/dirty state;
- ahead/behind;
- latest commit;
- open PRs;
- latest CI status;
- latest Vercel deployment;
- production URL status;
- known blockers.

Repo awal:

| Repo | Purpose |
|---|---|
| `systemswi` | SystemSWI command center |
| `wangi-creations-hub` | sensasiwangi.id marketplace/community |
| `holding-swi` | legacy/reference holding/Sukuk data |
| `systemswi-agent` archive branch | archived feature ideas only |

---

## 11. Proposed Data Contract

### 11.1 `Pillar`

```ts
type PillarName = "Media" | "Komunitas" | "Event" | "Retail";

type PillarSummary = {
  pillar: PillarName;
  health: "green" | "yellow" | "red" | "blocked";
  revenue: number;
  expense: number;
  net: number;
  activeProjects: number;
  pendingApprovals: number;
  openRisks: number;
  overdueTasks: number;
  lastUpdatedAt: string;
};
```

### 11.2 `CrossPillarActivity`

```ts
type CrossPillarActivity = {
  id: string;
  name: string;
  primaryPillar: PillarName;
  supportingPillars: PillarName[];
  status: "planned" | "active" | "closeout" | "completed" | "blocked";
  owner: string;
  relatedEntities: string[];
  revenue?: number;
  expense?: number;
  net?: number;
  riskLevel: "low" | "medium" | "high" | "critical";
};
```

### 11.3 `CommandCenterSnapshot`

```ts
type CommandCenterSnapshot = {
  generatedAt: string;
  sourceStatus: "live" | "partial" | "mock" | "blocked";
  pillars: PillarSummary[];
  crossPillarActivities: CrossPillarActivity[];
  approvals: ApprovalItem[];
  risks: RiskItem[];
  agents: AgentStatus[];
  repositories: RepoHealth[];
  deployments: DeploymentHealth[];
};
```

---

## 12. Mock Data Structure

```json
{
  "generatedAt": "2026-07-15T12:00:00+08:00",
  "sourceStatus": "mock",
  "pillars": [
    { "pillar": "Media", "health": "yellow", "revenue": 0, "expense": 0, "net": 0, "activeProjects": 3, "pendingApprovals": 0, "openRisks": 1, "overdueTasks": 2, "lastUpdatedAt": "2026-07-15" },
    { "pillar": "Komunitas", "health": "green", "revenue": 0, "expense": 0, "net": 0, "activeProjects": 2, "pendingApprovals": 0, "openRisks": 0, "overdueTasks": 0, "lastUpdatedAt": "2026-07-15" },
    { "pillar": "Event", "health": "yellow", "revenue": 29557561, "expense": 20568177, "net": 8989384, "activeProjects": 1, "pendingApprovals": 1, "openRisks": 1, "overdueTasks": 0, "lastUpdatedAt": "2026-07-15" },
    { "pillar": "Retail", "health": "yellow", "revenue": 0, "expense": 0, "net": 0, "activeProjects": 2, "pendingApprovals": 0, "openRisks": 1, "overdueTasks": 1, "lastUpdatedAt": "2026-07-15" }
  ]
}
```

---

## 13. Phased Implementation

### Phase 0 — Spec and Data Contract

- Approve this document.
- Decide source sheets/tables.
- Decide mapping legacy divisions to pillars.

### Phase 1 — Read-only API

- Add `/api/command-center/four-pillars`.
- Use mocked/derived data only.
- No writes.

### Phase 2 — UI Dashboard

- Add command center page/cards.
- Show pillars, approvals, risks, agent status, repo/deploy health.

### Phase 3 — Live Data Integration

- Connect Google Sheets/SystemSWI modules.
- Add sourceStatus per section.
- Add fallback if source blocked.

### Phase 4 — Agent Integration

- Agent/cron writes run summaries to audit log.
- Dashboard reads latest agent status.

### Phase 5 — Approval Workflows

- Deep link approval items to module pages.
- Do not alter thresholds without approval.

---

## 14. Acceptance Criteria

- [ ] Dashboard uses official name **SystemSWI**.
- [ ] Four pillars exactly: Media, Komunitas, Event, Retail.
- [ ] Cross-pillar activities support primary + supporting pillars.
- [ ] No silo assumption in data model.
- [ ] Pending approvals visible.
- [ ] Risk/blocker view visible.
- [ ] Agent/cron status visible.
- [ ] GitHub/deployment health visible.
- [ ] API distinguishes `live`, `partial`, `mock`, and `blocked` source status.
- [ ] No destructive writes in first implementation.
- [ ] Old `systemswi-agent` dashboard code is not merged/copied directly.

---

## 15. Risiko

| Risiko | Mitigasi |
|---|---|
| Salah mapping aktivitas ke pilar | Use primary/supporting pillars + manual override |
| Dashboard jadi silo | Explicit cross-pillar model |
| Data finance tidak lengkap | sourceStatus per section + data quality notes |
| Agent status stale | Include last_run_at and stale threshold |
| Repo/deploy health butuh credentials | Graceful degraded state if API unavailable |
| Scope melebar jadi ERP rewrite | Implement phased, read-only first |

---

## 16. Open Decisions

1. Apakah `Produksi` menjadi subdomain Retail atau Corporate Operations?
2. Apakah Website masuk Media, Retail, atau cross-pillar infrastructure?
3. Source utama KPI per pilar: Google Sheets existing, SystemSWI tables, atau hybrid?
4. Apakah health score perlu formula formal sejak Phase 1 atau cukup label manual?
5. Siapa owner tiap pilar?
6. Apakah agent/cron status disimpan di Google Sheets, file artifact, atau SystemSWI audit table?
7. Apakah GitHub/Vercel health memakai API token production atau hanya local git + public deployment checks?
