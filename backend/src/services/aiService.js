import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const MODEL = "llama-3.1-8b-instant";

const CATEGORIES = [
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "shopping",
  "utilities",
  "health",
  "other",
];

// helper — single Groq call
const chat = async (prompt) => {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 512,
  });
  return completion.choices[0].message.content.trim();
};

// 🔹 Categorize Expense
export const categorizeExpense = async (description, amount) => {
  try {
    const prompt = `Categorize this expense into exactly ONE category.

Expense: "${description}" (₹${amount})

Categories: ${CATEGORIES.join(", ")}

Rules:
- Output ONLY the category name, nothing else
- No explanation, no punctuation
- Must be exactly one word from the given list`;

    const text = await chat(prompt);
    const clean = text.toLowerCase().trim();
    return CATEGORIES.includes(clean) ? clean : "other";
  } catch (err) {
    console.error("AI categorization error:", err.message);
    return "other";
  }
};

// 🔹 Generate Insights
export const getSpendingInsights = async (req, res) => {
  try {
    const { expenses, members, groupName } = req.body;

    if (!expenses || expenses.length === 0) {
      return res.json({
        insights: "Add some expenses to get AI-powered spending insights!",
      });
    }

    const categoryTotals = {};
    const memberSpend = {};

    expenses.forEach((e) => {
      categoryTotals[e.category] =
        (categoryTotals[e.category] || 0) + parseFloat(e.amount);
      memberSpend[e.payer_name] =
        (memberSpend[e.payer_name] || 0) + parseFloat(e.amount);
    });

    const totalSpend = expenses.reduce(
      (sum, e) => sum + parseFloat(e.amount),
      0
    );

    const summary = `Group: ${groupName}
Total spend: ₹${totalSpend.toFixed(2)}
Number of expenses: ${expenses.length}
Category breakdown: ${JSON.stringify(categoryTotals)}
Top payers: ${JSON.stringify(memberSpend)}
Recent expenses: ${expenses
      .slice(0, 5)
      .map((e) => `${e.description} (₹${e.amount})`)
      .join(", ")}`;

    const prompt = `You are a smart expense analyst for a group expense splitting app.

Analyze the data below and give 3-4 actionable insights.

Rules:
- Plain text only, no markdown, no bullet symbols
- Each insight on its own line
- Start each line with a relevant emoji
- Be specific with numbers from the data
- Keep each insight to 1-2 sentences max

Focus on: biggest expense category, spending patterns, who is paying the most, one money-saving tip.

DATA:
${summary}`;

    const text = await chat(prompt);
    res.json({ insights: text });
  } catch (err) {
    console.error("AI insights error:", err.message);
    res.status(500).json({ error: "Could not generate insights" });
  }
};

// 🔹 Route Handler for Categorization
export const aiCategorizeRoute = async (req, res) => {
  try {
    const { description, amount } = req.body;
    const category = await categorizeExpense(description, amount);
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: "Categorization failed", category: "other" });
  }
};