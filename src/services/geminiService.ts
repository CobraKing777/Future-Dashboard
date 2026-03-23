import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Trade, Account } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzePerformance = async (trades: Trade[], account: Account, language: string = 'English'): Promise<string> => {
  if (trades.length === 0) return "No trades to analyze yet. Start journaling your trades to get AI insights!";

  const tradeSummary = trades.map(t => ({
    asset: t.asset,
    direction: t.direction,
    pnl: t.pnl,
    commission: t.commission,
    exits: t.exits.map(e => ({ price: e.price, contracts: e.contracts, reason: e.reason, logic: e.logic })),
    date: new Date(t.date).toLocaleDateString(),
  }));

  const prompt = `
    You are an expert Futures Trading Coach. Analyze the following trading performance for a ${account.propFirm} ${account.size}k ${account.type} account.
    
    Account Rules:
    - Profit Target: $${account.profitTarget}
    - Max Drawdown: $${account.maxDrawdown}
    - Consistency Rule: ${account.consistencyRule * 100}%
    
    Current Stats:
    - Balance: $${account.currentBalance}
    - Total Trades: ${trades.length}
    
    Trade Data (Recent):
    ${JSON.stringify(tradeSummary.slice(-10), null, 2)}
    
    Please provide the response in ${language} language:
    1. A summary of overall performance.
    2. Specific technical analysis (TA) patterns or mistakes identified.
    3. Psychological insights based on the notes and exit reasons (especially "Partial Closed" reasons).
    4. Actionable steps to improve or fix the current strategy.
    5. Suggestions for new rules or strategy adjustments.
    
    Keep the tone professional, encouraging, and direct.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Failed to generate analysis.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "An error occurred while analyzing your performance.";
  }
};
