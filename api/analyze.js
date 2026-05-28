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
        return cat + ': ' + pct + '% (' + level + ')';
      })
      .join('\n');

    const prompt = 'אתה מאמן של תוכנית "חטוב בלי תפריט", שיטה לשינוי הרגלים וירידה במשקל.\n' +
      'קיבלת את תוצאות הבוחן של ' + name + ' וצריך לכתוב ניתוח אישי קצר.\n\n' +
      'נתוני הבוחן:\n' +
      'ציון כולל: ' + score + ' מתוך 100\n' +
      catLines + '\n\n' +
      'כתוב בדיוק 3 פסקאות:\n\n' +
      'פסקה ראשונה: פתח בחיבור אישי. ציין את הציון הכולל (' + score + ' מתוך 100) ואת התחום שבו ' + name + ' הכי חזק (' + highestCat + ', ' + highestPct + '%). תגרום להם להרגיש שראית אותם ומבין אותם.\n\n' +
      'פסקה שנייה: דבר על האתגר הכי גדול שלהם (' + lowestCat + ', ' + lowestPct + '%). הסבר בשפה פשוטה ויומיומית מה קורה להם בגוף ובראש בגלל האתגר הזה, ולמה זה מקשה על ירידה במשקל. אל תשפוט ואל תביא פתרונות.\n\n' +
      'פסקה שלישית: תן תקווה אמיתית. הסבר שהקושי הזה לא קשור לאופי שלהם או לחוסר רצון, אלא לתבנית הרגלים שנוצרה, ושאפשר לשנות אותה בצורה הדרגתית שמתאימה לחיים האמיתיים שלהם.\n\n' +
      'כללים שאסור לשכוח:\n' +
      'כתוב ישירות אל ' + name + ' בגוף שני\n' +
      'עברית פשוטה וברורה בלבד, בלי מילים מקצועיות או מורכבות\n' +
      'חמות ואנושית כמו חבר טוב שמבין אותך\n' +
      'בלי מקפים מכל סוג בטקסט\n' +
      'בלי כותרות ובלי רשימות, רק 3 פסקאות רצופות\n' +
      'בלי פתרונות ספציפיים, רק הסבר של המצב ותקווה\n' +
      'אורך כולל: 120 עד 180 מילים';

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
