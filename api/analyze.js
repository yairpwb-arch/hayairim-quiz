const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, score, categories } = req.body;

    const sorted = Object.entries(categories).sort((a, b) => a[1] - b[1]);
    const lowestCat  = sorted[0][0];
    const highestCat = sorted[sorted.length - 1][0];

    const catLines = sorted
      .map(([cat, pct]) => `• ${cat}: ${pct}%`)
      .join('\n');

    const prompt = `אתה מאמן תזונה ובריאות של "היאירים" — תוכנית ייחודית לירידה במשקל ללא דיאטות.
ניתח את תוצאות הבוחן של ${name}.

ציון כולל: ${score}/100
ציונים לפי קטגוריה (ציון גבוה = הרגלים טובים יותר):
${catLines}

כתוב ניתוח אישי בעברית ב-3 פסקאות:
1. מה מייחד את ${name} — ציין את החוזקה הגדולה ביותר שלו/ה (${highestCat}) בצורה מעודדת
2. האתגר המרכזי (${lowestCat}) — הסבר בדיוק איך זה מונע ירידה במשקל, בלי שיפוטיות
3. צעד ראשון קונקרטי ומעשי שאפשר להתחיל בו היום — ספציפי ומדויק לפי הנתונים

כתוב ישירות אל ${name} בגוף שני, בחום, בהבנה, ובסגנון מקצועי. עברית בלבד. ללא כותרות.`;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ analysis: message.content[0].text });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
};
