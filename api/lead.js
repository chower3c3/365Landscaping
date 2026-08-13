export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    fname, lname, email, phone, msg,
    website, page_url, utm_source, utm_medium, utm_campaign
  } = req.body || {};

  // Honeypot: bots fill hidden fields, humans do not.
  // Return success so the bot does not retry.
  if (website) {
    return res.status(200).json({ ok: true });
  }

  if (!fname || !lname || !email || !msg) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.GHL_WEBHOOK_URL) {
    console.error('GHL_WEBHOOK_URL is not set');
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const ghlResponse = await fetch(process.env.GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: String(fname).slice(0, 100),
        last_name: String(lname).slice(0, 100),
        email: String(email).slice(0, 200),
        phone: phone ? String(phone).slice(0, 30) : '',
        property_needs: String(msg).slice(0, 2000),
        page_url: page_url || '',
        utm_source: utm_source || '',
        utm_medium: utm_medium || '',
        utm_campaign: utm_campaign || '',
        submitted_at: new Date().toISOString()
      })
    });

    if (!ghlResponse.ok) {
      console.error('GHL webhook failed:', ghlResponse.status, await ghlResponse.text());
      return res.status(502).json({ error: 'Could not deliver lead' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead submission error:', err);
    return res.status(500).json({ error: 'Could not deliver lead' });
  }
}
