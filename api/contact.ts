// src/pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = 
  | { ok: true }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1) Solo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2) CORS: orígenes permitidos
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(u => u.trim());
  const origin = req.headers.origin;
  if (!origin || !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 3) Valida payload
  const { name, email, message, categories } = req.body;
  if (
    typeof name !== 'string'   ||
    typeof email !== 'string'  ||
    typeof message !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (name.trim().length < 3) {
    return res.status(400).json({ error: 'Name too short' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Message too short' });
  }

  // 4) Llama al endpoint de EmailJS
  try {
    const resp = await fetch(
      'https://api.emailjs.com/api/v1.0/email/send',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:    process.env.EMAILJS_SERVICE_ID,
          template_id:   process.env.EMAILJS_TEMPLATE_ID,
          user_id:       process.env.EMAILJS_PUBLIC_KEY,
          accessToken:   process.env.EMAILJS_PRIVATE_KEY,
          template_params: {
            user_name:    name,
            user_email:   email,
            user_message: message,
            categories:   categories || '',
            // si tu template usa otras variables (p.e. CONTACT_DEST), añádelas aquí
          }
        })
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error('EmailJS error:', resp.status, text);
      throw new Error(`EmailJS responded ${resp.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('❌ sendEmail error:', err);
    return res.status(500).json({ error: 'Error sending email' });
  }
}
