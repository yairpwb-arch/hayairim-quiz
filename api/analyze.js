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

    const prompt = 'אתה מאמן של תוכנית "חטוב בלי תפריט".\n\n' +
      'תוצאות הבוחן של ' + name + ':\n' +
      'ציון כולל: ' + score + '/100\n' +
      catLines + '\n\n' +
      'משימה:\n' +
      'כתוב פסקה אחת בעברית, עד 60 מילים, הפונה אל ' + name + ' ישירות בגוף שני.\n\n' +
      'הפסקה חייבת:\n' +
      '1. לפתוח ישירות בעניין — בלי משפט פתיחה כללי כמו "תודה שמילאת" או "הנה התוצאות שלך"\n' +
      '2. לציין בשם את הקטגוריה עם האחוז הגבוה ביותר (' + highestCat + ') ואת הקטגוריה עם האחוז הנמוך ביותר (' + lowestCat + ')\n' +
      '3. להסביר במשפט אחד שהפער נובע מהרגל ספציפי וניתן לשינוי — לא מחוסר כוח רצון, משמעת או אופי\n' +
      '4. להימנע ממילים כמו: "מדהים", "מרשים", "פוטנציאל", "מסע", "לגלות את", "לשנות את החיים"\n\n' +
      'אסור:\n' +
      '- כותרות, מקפים, בולטים, רשימות\n' +
      '- יותר מפסקה אחת\n' +
      '- טון מכירתי, מוטיבציוני, או דרמטי\n' +
      '- שגיאות כתיב\n\n' +
      'טון: רגוע, ישיר, כמו מאמן שמסביר תוצאה של בדיקה ללקוח — לא כמו קופירייטר.';

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
