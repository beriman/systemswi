# n8n MCP Integration - Directive untuk BMad Master

## 🎯 Tujuan
Memberikan panduan lengkap kepada BMad Master untuk menggunakan **n8n MCP Server** dalam orchestrating workflows eksternal dan automation tasks.

## 📋 Kapan Menggunakan n8n MCP

BMad Master harus menggunakan n8n MCP ketika:
- ✅ Perlu trigger external notifications (Slack, Discord, Email)
- ✅ Perlu integrate dengan external systems/APIs
- ✅ Perlu schedule recurring tasks
- ✅ Perlu orchestrate complex multi-step workflows
- ✅ User request untuk automation yang melibatkan external services

Jangan gunakan n8n MCP untuk:
- ❌ Simple internal operations (gunakan execution scripts)
- ❌ One-time manual tasks
- ❌ Operations yang bisa dilakukan langsung di code

---

## 🔌 Step 1: Initialize n8n Connection

**CRITICAL**: Sebelum menggunakan n8n tools, WAJIB initialize connection terlebih dahulu.

### Command
```javascript
mcp_n8n_init-n8n({
  "url": "https://n8n.srv1206623.hstgr.cloud",
  "apiKey": "{{SECRET:N8N_API_KEY}}"
})
```

### Verification
Setelah init, Anda akan mendapat `clientId`. **SIMPAN clientId ini** untuk digunakan di semua n8n MCP calls selanjutnya.

**Expected Response:**
```json
{
  "clientId": "unique-client-id-here",
  "status": "connected",
  "message": "Successfully connected to n8n instance"
}
```

---

## 🛠️ Available n8n MCP Tools

BMad Master memiliki akses ke **33 n8n MCP tools**. Berikut yang paling sering digunakan:

### Workflow Management

#### 1. List Workflows
```javascript
mcp_n8n_list-workflows({
  "clientId": "your-client-id"
})
```

**Use Case**: Lihat semua workflows yang tersedia sebelum execute/modify.

---

#### 2. Get Workflow Details
```javascript
mcp_n8n_get-workflow({
  "clientId": "your-client-id",
  "id": "workflow-id"
})
```

**Use Case**: Baca struktur workflow sebelum update atau debug.

---

#### 3. Create Workflow
```javascript
mcp_n8n_create-workflow({
  "clientId": "your-client-id",
  "name": "DOE Notification Workflow",
  "nodes": [],
  "connections": {}
})
```

**Important**: 
- `nodes` dan `connections` harus valid n8n workflow structure
- Gunakan existing workflow sebagai template
- Test workflow before activation

---

#### 4. Activate Workflow
```javascript
mcp_n8n_activate-workflow({
  "clientId": "your-client-id",
  "id": "workflow-id"
})
```

**Use Case**: Enable workflow untuk production use.

---

#### 5. Deactivate Workflow
```javascript
mcp_n8n_deactivate-workflow({
  "clientId": "your-client-id",
  "id": "workflow-id"
})
```

**Use Case**: Disable workflow untuk maintenance atau debugging.

---

### Execution Monitoring

#### 6. List Executions
```javascript
mcp_n8n_list-executions({
  "clientId": "your-client-id",
  "workflowId": "workflow-id",  // optional
  "status": "error",            // optional: error/success/waiting
  "limit": 10,                  // optional
  "includeData": false          // optional
})
```

**Use Case**: Monitor workflow runs, debug failures.

---

#### 7. Get Execution Details
```javascript
mcp_n8n_get-execution({
  "clientId": "your-client-id",
  "id": 12345,
  "includeData": true
})
```

**Use Case**: Debug specific execution failure dengan full data.

---

### Tags & Organization

#### 8. Create Tag
```javascript
mcp_n8n_create-tag({
  "clientId": "your-client-id",
  "name": "DOE-Automation"
})
```

---

#### 9. Update Workflow Tags
```javascript
mcp_n8n_update-workflow-tags({
  "clientId": "your-client-id",
  "workflowId": "workflow-id",
  "tagIds": [{"id": "tag-id-1"}, {"id": "tag-id-2"}]
})
```

**Use Case**: Organize workflows by project/purpose.

---

### Credentials Management

#### 10. Get Credential Schema
```javascript
mcp_n8n_get-credential-schema({
  "clientId": "your-client-id",
  "credentialTypeName": "slackApi"
})
```

**Use Case**: Lihat fields apa yang diperlukan sebelum create credential.

---

#### 11. Create Credential
```javascript
mcp_n8n_create-credential({
  "clientId": "your-client-id",
  "name": "Slack Bot Token",
  "type": "slackApi",
  "data": {
    "accessToken": "xoxb-your-token-here"
  }
})
```

**Important**: Gunakan `get-credential-schema` dulu untuk tahu structure.

---

### Security Audit

#### 12. Generate Audit
```javascript
mcp_n8n_generate-audit({
  "clientId": "your-client-id",
  "categories": ["credentials", "nodes", "instance"]
})
```

**Use Case**: Security review, compliance check.

---

## 🎯 Common Use Cases & Workflows

### Use Case 1: Send Notification ketika Task Selesai

**Scenario**: BMad Master finish task → notify user via Slack

**Steps**:
1. Init n8n connection
2. List workflows → find "Task Completion Notification"
3. Get workflow details untuk confirm struktur
4. Trigger workflow with task details

**Code Flow**:
```javascript
// 1. Init
const client = mcp_n8n_init-n8n({...})

// 2. List workflows
const workflows = mcp_n8n_list-workflows({clientId: client.clientId})

// 3. Find notification workflow
const notifWorkflow = workflows.find(w => w.name.includes("Notification"))

// 4. Check if active
if (!notifWorkflow.active) {
  mcp_n8n_activate-workflow({
    clientId: client.clientId,
    id: notifWorkflow.id
  })
}

// 5. Trigger via webhook (if webhook-based)
// Note: Actual trigger depends on workflow type
```

---

### Use Case 2: Create New Automation Workflow

**Scenario**: User request "Kirim daily report ke email every morning"

**Steps**:
1. Init n8n connection
2. Design workflow structure (Schedule → Fetch Data → Send Email)
3. Create credentials for email service
4. Create workflow dengan nodes
5. Test workflow
6. Activate workflow

**Template Workflow Structure**:
```json
{
  "name": "Daily Report Email",
  "nodes": [
    {
      "id": "schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 9 * * *"}]
        }
      }
    },
    {
      "id": "getData",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.example.com/report"
      }
    },
    {
      "id": "sendEmail",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "user@example.com",
        "subject": "Daily Report"
      }
    }
  ],
  "connections": {
    "schedule": {"main": [[{"node": "getData", "type": "main", "index": 0}]]},
    "getData": {"main": [[{"node": "sendEmail", "type": "main", "index": 0}]]}
  }
}
```

---

### Use Case 3: Monitor & Debug Failed Workflow

**Scenario**: Workflow failed → investigate → fix

**Steps**:
1. List executions with status=error
2. Get execution details untuk see error message
3. Identify problem (credentials? API down? logic error?)
4. Fix workflow
5. Update workflow
6. Retry execution

**Code Flow**:
```javascript
// 1. Find failed executions
const failures = mcp_n8n_list-executions({
  clientId: client.clientId,
  status: "error",
  limit: 5
})

// 2. Get details of most recent failure
const failureDetails = mcp_n8n_get-execution({
  clientId: client.clientId,
  id: failures[0].id,
  includeData: true
})

// 3. Analyze error
console.log(failureDetails.data.resultData.error)

// 4. Get workflow for editing
const workflow = mcp_n8n_get-workflow({
  clientId: client.clientId,
  id: failures[0].workflowId
})

// 5. Fix and update
// (modify workflow.nodes or workflow.connections)
mcp_n8n_update-workflow({
  clientId: client.clientId,
  id: workflow.id,
  workflow: {
    // fixed workflow here
  }
})
```

---

## ⚠️ Important Gotchas & Best Practices

### 1. Always Init First
```javascript
// ❌ WRONG - will fail
mcp_n8n_list-workflows({clientId: "???"})

// ✅ CORRECT
const client = mcp_n8n_init-n8n({...})
mcp_n8n_list-workflows({clientId: client.clientId})
```

---

### 2. Check Workflow Active Status
```javascript
// ❌ WRONG - assume workflow is active
// trigger workflow...

// ✅ CORRECT - verify first
const workflow = mcp_n8n_get-workflow({id: "..."})
if (!workflow.active) {
  mcp_n8n_activate-workflow({id: workflow.id})
}
// then trigger
```

---

### 3. Use Proper JSON Formatting for MCP
```javascript
// ❌ WRONG - multi-line with formatting
mcp_n8n_create-workflow({
  clientId: "...",
  name: "My Workflow",
  nodes: [
    // ...
  ]
})

// ✅ CORRECT - compact single-line JSON
mcp_n8n_create-workflow({"clientId":"...","name":"My Workflow","nodes":[],"connections":{}})
```

**Per MCP requirement**: Arguments must be compact, single-line JSON.

---

### 4. Handle Credentials Securely
```javascript
// ❌ WRONG - hardcode sensitive data
mcp_n8n_create-credential({
  data: {
    apiKey: "sk-1234567890abcdef"
  }
})

// ✅ CORRECT - use secret reference
mcp_n8n_create-credential({
  data: {
    apiKey: "{{SECRET:EXTERNAL_API_KEY}}"
  }
})
```

---

### 5. Tag Workflows for Organization
```javascript
// Create tag
const tag = mcp_n8n_create-tag({
  clientId: client.clientId,
  name: "SensasiWangi-Automation"
})

// Apply to workflows
mcp_n8n_update-workflow-tags({
  clientId: client.clientId,
  workflowId: workflow.id,
  tagIds: [{id: tag.id}]
})
```

**Benefit**: Easy filtering by project/client.

---

## 🚨 Error Handling

### Common Errors & Solutions

#### Error: "Client not initialized"
```
Solution: Call mcp_n8n_init-n8n first
```

#### Error: "Workflow not found"
```
Solution: Use mcp_n8n_list-workflows to get correct ID
```

#### Error: "Invalid node configuration"
```
Solution: Get credential schema first, validate node params
```

#### Error: "Quota exceeded"
```
Solution: Check n8n instance plan limits
```

---

## 📊 Decision Tree: Kapan Gunakan n8n vs Execution Script

```
User request automation
    │
    ├─ External service involved? (Slack, Email, etc.)
    │   └─ YES → Use n8n MCP
    │
    ├─ Need scheduling/recurring?
    │   └─ YES → Use n8n MCP
    │
    ├─ Complex multi-step with external APIs?
    │   └─ YES → Use n8n MCP
    │
    └─ Simple internal operation?
        └─ YES → Use execution script (Python)
```

---

## 🎓 Training Exercises for BMad Master

### Exercise 1: List All Workflows
```javascript
// Init connection
// List all workflows
// Display in numbered list for user
```

### Exercise 2: Create Simple Webhook Workflow
```javascript
// Create workflow with:
// - Webhook trigger
// - HTTP Request node
// - Response node
```

### Exercise 3: Monitor Failed Executions
```javascript
// List executions with status=error
// For each: get details and display error message
// Suggest fixes based on error type
```

---

## 🔗 Integration dengan DOE Framework

### Directive Layer
- **This file** = Directive untuk n8n usage
- Location: `directives/n8n-integration-bmad-master.md`

### Orchestration Layer
- **BMad Master** reads this directive
- Decides when to use n8n MCP vs execution scripts
- Coordinates workflow creation/monitoring

### Execution Layer
- **n8n MCP tools** = Actual execution
- **Execution script** (optional): `execution/n8n_automation.py` untuk complex operations

---

## 📚 Related Resources

### n8n Documentation
- [n8n API Reference](https://docs.n8n.io/api/)
- [n8n Workflow Examples](https://n8n.io/workflows/)
- [n8n Node Types](https://docs.n8n.io/integrations/builtin/)

### Internal Documentation
- Main Integration Doc: `GEMINI.md` (Section 9: n8n Integration)
- General Directive: `directives/general-project.md`

### n8n Instance
- URL: https://n8n.srv1206623.hstgr.cloud
- Access: Via MCP, no direct browser login from agent

---

## ✅ Checklist: BMad Master n8n Competency

Before using n8n MCP in production, BMad Master should verify:

- [ ] Can successfully initialize n8n connection
- [ ] Can list and filter workflows
- [ ] Can get workflow details and understand structure
- [ ] Can create simple workflows (webhook → action)
- [ ] Can activate/deactivate workflows
- [ ] Can monitor executions and identify errors
- [ ] Can create and manage credentials securely
- [ ] Can update existing workflows
- [ ] Can use tags for organization
- [ ] Understands when to use n8n vs execution scripts

---

## 🎯 Next Steps untuk BMad Master

1. **Practice**: Run through training exercises
2. **Real Use Case**: Create notification workflow untuk task completion
3. **Integration**: Add menu item ke BMad Master menu:
   ```
   [N8] n8n Workflow Manager
   ```
4. **Automation**: Create common workflow templates
5. **Monitoring**: Setup daily audit untuk workflow health

---

**Last Updated**: 2026-01-12  
**Version**: 1.0  
**Author**: System Orchestration Team
