import { google } from "googleapis";
import { getAuth } from "@/lib/sheets/sheets-real";

const MEMORY_LOG_DOC_ID = process.env.SWI_MEMORY_LOG_DOC_ID || "1jCBaspDMsLRIGjrrXjHnzV0cfBMTHQhp9Az8p2FAyu8";

export type SwiAuditAction = {
  actor?: string;
  action: string;
  target: string;
  summary: string;
  timestamp?: string;
};

function sanitize(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function formatSwiAuditLine(entry: SwiAuditAction) {
  const timestamp = entry.timestamp || new Date().toISOString();
  const actor = sanitize(entry.actor || "Hermes/HemuHemu");
  const action = sanitize(entry.action);
  const target = sanitize(entry.target);
  const summary = sanitize(entry.summary);
  return `[${timestamp}] | ${actor} | ${action} | ${target} | ${summary}`;
}

export async function appendSwiMemoryLog(entry: SwiAuditAction) {
  const auth = getAuth();
  const docs = google.docs({ version: "v1", auth });
  const line = formatSwiAuditLine(entry);

  const doc = await docs.documents.get({ documentId: MEMORY_LOG_DOC_ID });
  const content = doc.data.body?.content || [];
  const last = content[content.length - 1];
  const endIndex = last?.endIndex || 1;
  const insertIndex = Math.max(endIndex - 1, 1);

  await docs.documents.batchUpdate({
    documentId: MEMORY_LOG_DOC_ID,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: insertIndex },
            text: `${line}\n`,
          },
        },
      ],
    },
  });

  return { docId: MEMORY_LOG_DOC_ID, line };
}
