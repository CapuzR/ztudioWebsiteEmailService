// api/contact.js
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message, categories } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // create transporter
  const transporter = nodemailer.createTransport({
    host:     process.env.SMTP_HOST,
    port:     Number(process.env.SMTP_PORT),
    secure:   process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: `"Web Contact" <${process.env.SMTP_USER}>`,
      to:   process.env.CONTACT_DEST,
      subject: `Nuevo mensaje de ${name}`,
      text: `
Name: ${name}
Email: ${email}
Categories: ${categories || ''}
Message:
${message}
      `
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err);
    return res.status(500).json({ error: 'Error sending email' });
  }
};
