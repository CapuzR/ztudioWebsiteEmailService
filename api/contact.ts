import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = 
  | { ok: true }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1) Siempre responder OPTIONS para el preflight
  res.setHeader('Access-Control-Allow-Origin', '*');                 // o pon tu dominio concreto
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 2) Sólo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3) Valida origen si no usas '*'
  // const origin = req.headers.origin;
  // if (origin !== 'http://a3shf-....localhost:4943') {
  //   return res.status(403).json({ error: 'Forbidden' });
  // }

  // 4) Valida el body
  const { name, email, message, categories } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // 5) Llama a EmailJS
  try {
    const emailjsResp = await fetch(
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
          }
        })
      }
    );
    if (!emailjsResp.ok) {
      const text = await emailjsResp.text();
      console.error('EmailJS error:', emailjsResp.status, text);
      throw new Error(`EmailJS ${emailjsResp.status}`);
    }
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('❌ sendEmail error:', err);
    return res.status(500).json({ error: 'Error sending email' });
  }
}
