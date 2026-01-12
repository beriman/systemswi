# n8n Workflow: SWI Public Chat Assistant

## Overview
Workflow ini menerima chat message dari frontend, mengambil memory dari Google Drive, memanggil OpenRouter LLM, menyimpan conversation history, dan mengembalikan response.

## Workflow Structure

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Webhook  │───▶│   Get    │───▶│  Build   │───▶│   LLM    │───▶│  Save    │
│ Trigger  │    │  Memory  │    │  Prompt  │    │  Call    │    │  Memory  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                                      │
                                                                      ▼
                                                                ┌──────────┐
                                                                │ Respond  │
                                                                │ Webhook  │
                                                                └──────────┘
```

## Node Configuration

### 1. Webhook Trigger
- **Type**: `n8n-nodes-base.webhook`
- **HTTP Method**: POST
- **Path**: `/swi-chat`
- **Response Mode**: Response to Webhook

**Expected Input:**
```json
{
  "sessionId": "sess_abc123",
  "message": "User message here",
  "timestamp": "2026-01-12T09:00:00Z"
}
```

---

### 2. Get Memory (Google Drive)
- **Type**: `n8n-nodes-base.googleDrive`
- **Operation**: Download File
- **File ID**: `{{ get from folder search by sessionId }}`

**Alternative**: Use Google Sheets for simpler memory storage

---

### 3. Build Prompt (Code Node)
- **Type**: `n8n-nodes-base.code`
- **Language**: JavaScript

```javascript
// Build conversation history for LLM
const session = $input.first().json;
const memory = $('Get Memory').first().json.messages || [];
const newMessage = $('Webhook').first().json;

const systemPrompt = `Kamu adalah SWI Assistant, asisten virtual untuk Sensasi Wangi Indonesia.

Sensasi Wangi Indonesia (SWI) adalah perusahaan yang bergerak di bidang:
- Parfum artisan dan fragrance house
- Event organizer untuk workshop parfum
- Konsultasi dan kreasi custom fragrance
- Pengembangan ekosistem wewangian Nusantara

Kamu bisa membantu dengan:
- Informasi produk dan layanan
- Jadwal event dan workshop
- Konsultasi parfum
- Kerjasama dan partnership
- Pertanyaan umum tentang parfum

Gunakan Bahasa Indonesia yang ramah dan profesional.
Jawab singkat dan jelas, maksimal 100 kata per respons.
Jika tidak tahu jawaban, arahkan ke WhatsApp: +62 811-855-6688`;

// Build messages array
const messages = [
  { role: 'system', content: systemPrompt },
  ...memory.slice(-10), // Last 10 messages for context
  { role: 'user', content: newMessage.message }
];

return { messages, sessionId: newMessage.sessionId };
```

---

### 4. LLM Call (HTTP Request)
- **Type**: `n8n-nodes-base.httpRequest`
- **Method**: POST
- **URL**: `https://openrouter.ai/api/v1/chat/completions`

**Headers:**
```json
{
  "Authorization": "Bearer {{ $credentials.openRouterApi.apiKey }}",
  "Content-Type": "application/json",
  "HTTP-Referer": "https://sensasiwangi.id"
}
```

**Body:**
```json
{
  "model": "google/gemini-2.0-flash-001",
  "messages": "{{ $json.messages }}",
  "max_tokens": 500,
  "temperature": 0.7
}
```

---

### 5. Save Memory (Google Drive)
- **Type**: `n8n-nodes-base.googleDrive`
- **Operation**: Update File

**Content to Save:**
```javascript
// In Code node before save
const prevMessages = $('Get Memory').first().json.messages || [];
const userMessage = {
  role: 'user',
  content: $('Webhook').first().json.message,
  timestamp: new Date().toISOString()
};
const assistantMessage = {
  role: 'assistant',
  content: $('LLM Call').first().json.choices[0].message.content,
  timestamp: new Date().toISOString()
};

return {
  sessionId: $('Webhook').first().json.sessionId,
  messages: [...prevMessages, userMessage, assistantMessage],
  updated: new Date().toISOString()
};
```

---

### 6. Respond to Webhook
- **Type**: `n8n-nodes-base.respondToWebhook`
- **Response Code**: 200

**Response Body:**
```json
{
  "response": "{{ $('LLM Call').first().json.choices[0].message.content }}",
  "sessionId": "{{ $('Webhook').first().json.sessionId }}",
  "timestamp": "{{ $now.toISOString() }}"
}
```

---

## Credentials Required

### 1. OpenRouter API
- **Type**: `openRouterApi` (custom)
- **Fields**: `apiKey`

### 2. Google Drive OAuth
- **Type**: `googleDriveOAuth2Api`
- **Scopes**: `drive.file`

---

## Environment Configuration

Add to `.env.local`:
```env
# n8n Chat Webhook URL
NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL=https://n8n.srv1206623.hstgr.cloud/webhook/swi-chat
```

---

## Error Handling

Add Error Trigger node with:
1. Log error to monitoring
2. Return friendly error message:
```json
{
  "response": "Maaf, sedang ada gangguan teknis. Silakan hubungi kami via WhatsApp: +62 811-855-6688",
  "error": true
}
```

---

## Rate Limiting (Optional)

Add Rate Limiter node atau Code node untuk:
- Max 20 messages per session
- Max 100 sessions per day
- Cooldown 1 second between messages

---

## Testing

### cURL Test
```bash
curl -X POST https://n8n.srv1206623.hstgr.cloud/webhook/swi-chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "message": "Halo, apa saja layanan SWI?",
    "timestamp": "2026-01-12T09:00:00Z"
  }'
```

### Expected Response
```json
{
  "response": "Halo! Sensasi Wangi Indonesia menyediakan layanan...",
  "sessionId": "test-123",
  "timestamp": "2026-01-12T09:00:05Z"
}
```

---

## Deployment Checklist

- [ ] Create n8n workflow dengan nodes di atas
- [ ] Setup OpenRouter credential di n8n
- [ ] Setup Google Drive OAuth credential di n8n
- [ ] Create Google Drive folder untuk memory
- [ ] Activate workflow
- [ ] Test webhook endpoint
- [ ] Update NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL di production
