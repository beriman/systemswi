// Gmail API integration for SWI
// Uses the same Google OAuth token with gmail.readonly + gmail.send scopes
import { google } from "googleapis";
import fs from "fs";

const TOKEN_PATH = "/home/ubuntu/.hermes/google_token.json";

let cachedAuth: any = null;

function getAuth() {
  if (cachedAuth) return cachedAuth;
  const content = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
  const oauth2 = new google.auth.OAuth2(
    content.client_id,
    content.client_secret,
    "http://localhost:1"
  );
  oauth2.setCredentials({
    refresh_token: content.refresh_token,
    access_token: content.token,
    token_type: "Bearer",
    expiry_date: content.expiry,
  });
  cachedAuth = oauth2;
  return cachedAuth;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  labelIds: string[];
  body?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  date: string;
  messageCount: number;
  messages: EmailMessage[];
}

function parseMessage(msg: any): EmailMessage {
  const headers = msg.payload?.headers || [];
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    headerMap[h.name.toLowerCase()] = h.value;
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: headerMap["from"] || "",
    to: headerMap["to"] || "",
    subject: headerMap["subject"] || "(no subject)",
    date: headerMap["date"] || "",
    snippet: msg.snippet || "",
    labelIds: msg.labelIds || [],
    body: msg.body,
  };
}

export async function listEmails(options?: {
  query?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
}): Promise<{ messages: EmailMessage[]; nextPageToken?: string; resultSizeEstimate: number }> {
  const auth = getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const params: any = {
    userId: "me",
    maxResults: options?.maxResults || 25,
  };
  if (options?.query) params.q = options.query;
  if (options?.labelIds) params.labelIds = options.labelIds;
  if (options?.pageToken) params.pageToken = options.pageToken;

  const result = await gmail.users.messages.list(params);
  const messages = (result.data.messages || []).map((m: any) =>
    parseMessage(
      gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["From", "To", "Subject", "Date"] })
    )
  );

  // Fetch full messages in parallel
  const fullMessages = await Promise.all(
    (result.data.messages || []).map(async (m: any) => {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });
      return parseMessage(full.data);
    })
  );

  return {
    messages: fullMessages,
    nextPageToken: result.data.nextPageToken || undefined,
    resultSizeEstimate: result.data.resultSizeEstimate || 0,
  };
}

export async function getEmail(messageId: string): Promise<EmailMessage> {
  const auth = getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const result = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const msg = result.data;
  const headers = msg.payload?.headers || [];
  const headerMap: Record<string, string> = {};
  for (const h of headers) {
    headerMap[h.name.toLowerCase()] = h.value;
  }

  // Extract body
  let body = "";
  if (msg.payload?.body?.data) {
    body = Buffer.from(msg.payload.body.data, "base64").toString("utf-8");
  } else if (msg.payload?.parts) {
    for (const part of msg.payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
        break;
      }
      if (part.mimeType === "text/html" && part.body?.data && !body) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    }
  }

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: headerMap["from"] || "",
    to: headerMap["to"] || "",
    subject: headerMap["subject"] || "(no subject)",
    date: headerMap["date"] || "",
    snippet: msg.snippet || "",
    labelIds: msg.labelIds || [],
    body,
  };
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}): Promise<{ id: string; threadId: string; labelIds: string[] }> {
  const auth = getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const lines = [
    `To: ${options.to}`,
    options.cc ? `Cc: ${options.cc}` : null,
    options.bcc ? `Bcc: ${options.bcc}` : null,
    `Subject: ${options.subject}`,
    options.replyTo ? `Reply-To: ${options.replyTo}` : null,
    "Content-Type: text/plain; charset=utf-8",
    "",
    options.body,
  ]
    .filter(Boolean)
    .join("\r\n");

  const encoded = Buffer.from(lines).toString("base64url");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
    },
  });

  return {
    id: result.data.id,
    threadId: result.data.threadId,
    labelIds: result.data.labelIds || [],
  };
}

export async function getLabels(): Promise<{ id: string; name: string; type: string }[]> {
  const auth = getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const result = await gmail.users.labels.list({ userId: "me" });
  return (result.data.labels || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    type: l.type,
  }));
}

export async function searchEmails(query: string, maxResults = 25): Promise<EmailMessage[]> {
  const result = await listEmails({ query, maxResults });
  return result.messages;
}
