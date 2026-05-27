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
    const lowestPct  = sorted[0][1];
    const highestCat = sorted[sorted.length - 1][0];
    const highestPct = sorted[sorted.length - 1][1];

    const catLines = sorted
      .map(([cat, pct]) => {
        const level = pct >= 70 ? 'חזק' : pct >= 40 ? 'בינוני' : 'דורש שיפור';
        return `• ${cat}: ${pct}% (${level})`;
      })
      .join('\n');

    const prompt = `אתה מאמן ותיק של תוכנית "חטוב בלי תפריט" — שיטה ייחודית לשינוי הרגלים וירידה במשקל ללא דיאטות.
קיבלת את תוצאות הבוחן של ${name}. עליך לכתוב ניתוח אישי שירגיש כאילו מישהו שמכיר אותם היטב כתב אותו.

נתוני הבוחן:
ציון כולל: ${score}/100
${catLines}

הנחיות לניתוח:
— פסקה 1 (2-3 משפטים): פתח בהכרה אישית — התייחס לציון הכולל (${score}) ולחוזקה הגדולה של ${name} (${highestCat} — ${highestPct}%). גרום להם להרגיש שראית אותם.
— פסקה 2 (2-3 משפטים): האתגר המרכזי — ${lowestCat} (${lowestPct}%). הסבר בשפה פשוטה ואנושית מה קורה בגוף/ראש כשהאתגר הזה פועל, ולמה בדיוק זה מעכב ירידה במשקל. אל תשפוט.
— פסקה 3 (2-3 משפטים): צעד ראשון מעשי ומדויק שניתן להתחיל בו מחר בבוקר — ספציפי לאתגר שזיהית, לא טיפ גנרי.

כללים:
✓ כתוב ישירות אל ${name} בגוף שני
✓ עברית טבעית ונגישה, לא קלינית
✓ חמות מקצועיות — כמו מאמן אישי טוב, לא רובוט
✓ ללא כותרות, ללא bullet points, רק 3 פסקאות זורמות
✓ אורך: 120-180 מילים בסך הכל`;

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
