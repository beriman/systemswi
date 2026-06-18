const { google } = require('googleapis');
const fs = require('fs');
const TOKEN_PATH='/home/ubuntu/.hermes/google_token.json';
const content = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
const oauth2 = new google.auth.OAuth2(content.client_id, content.client_secret, 'http://localhost:1');
oauth2.setCredentials({ refresh_token: content.refresh_token, access_token: content.token, token_type: 'Bearer', expiry_date: content.expiry_date });
const gmail = google.gmail({ version: 'v1', auth: oauth2 });

async function getBody(msgData) {
  const parts = msgData.payload?.parts || [];
  const htmlPart = parts.find(p => p.mimeType === 'text/html');
  if (htmlPart) {
    const html = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const textPart = parts.find(p => p.mimeType === 'text/plain') || msgData.payload;
  if (textPart?.body?.data) {
    return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
  }
  return '';
}

async function main() {
  console.log('=== TAGIHAN BPJS KETENAGAKERJAAN ===');
  const bills = await gmail.users.messages.list({ userId: 'me', q: 'Lembar Tagihan Iuran BPJS', maxResults: 3 });
  const billMsgs = bills.data.messages || [];
  for (const m of billMsgs) {
    const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    const body = await getBody(full.data);
    console.log('Subject:', h.subject);
    console.log('Date:', h.date);
    console.log('Body:', body.substring(0, 1000));
    console.log('---');
  }

  console.log('\n=== KWITANSI PEMBAYARAN TERBARU ===');
  const receipts = await gmail.users.messages.list({ userId: 'me', q: 'Pemberitahuan Penerimaan Iuran NPP 25216707', maxResults: 3 });
  const receiptMsgs = receipts.data.messages || [];
  for (const m of receiptMsgs) {
    const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    const body = await getBody(full.data);
    console.log('Subject:', h.subject);
    console.log('Date:', h.date);
    console.log('Body:', body.substring(0, 1000));
    console.log('---');
  }

  console.log('\n=== BPJS KESEHATAN ===');
  const kesehatan = await gmail.users.messages.list({ userId: 'me', q: 'BPJS Kesehatan', maxResults: 5 });
  const kesMsgs = kesehatan.data.messages || [];
  console.log('Found:', kesMsgs.length, 'emails');
  for (const m of kesMsgs) {
    const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['From','Subject','Date'] });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    console.log('From:', h.from, '| Subject:', h.subject, '| Date:', h.date);
  }

  console.log('\n=== PENDAFTARAN BPJS ===');
  const reg = await gmail.users.messages.list({ userId: 'me', q: 'Pendaftaran Badan Usaha BPJS', maxResults: 3 });
  const regMsgs = reg.data.messages || [];
  for (const m of regMsgs) {
    const full = await gmail.users.messages.get({ userId: 'me', id: m.id, format: 'full' });
    const h = {};
    (full.data.payload?.headers || []).forEach(x => h[x.name.toLowerCase()] = x.value);
    const body = await getBody(full.data);
    console.log('Subject:', h.subject);
    console.log('Date:', h.date);
    console.log('Body:', body.substring(0, 1000));
    console.log('---');
  }
}

main().catch(e => console.error(e.message));
