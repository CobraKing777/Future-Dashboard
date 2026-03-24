import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Economic News Proxy
  app.get("/api/news", async (req, res) => {
    const urls = [
      "https://nfs.forexfactory.com/ff_calendar_thisweek.json",
      "https://www.forexfactory.com/ff_calendar_thisweek.json"
    ];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const filteredData = data.filter((item: any) => 
            item.country === "USD" && 
            (item.impact === "High" || item.impact === "Medium")
          );
          return res.json(filteredData);
        }
      } catch (error) {
        // Silent fail for individual URLs
      }
    }
    res.status(503).json({ error: "External news service unavailable" });
  });

  // Real-time Headlines Proxy (Mocking with a reliable RSS-to-JSON or similar if needed, but here we'll use a public feed)
  app.get("/api/headlines", async (req, res) => {
    try {
      // Using a public financial news RSS feed (converted to JSON via a free service or just fetching directly if it's JSON)
      // For this app, we'll use a reliable public source or mock for stability
      const headlines = [
        { id: 1, title: "S&P 500 Futures Edge Higher as Investors Await PCE Data", source: "Reuters", time: "2m ago", impact: "Medium" },
        { id: 2, title: "Treasury Yields Steady Following FOMC Commentary", source: "Bloomberg", time: "15m ago", impact: "Low" },
        { id: 3, title: "Tech Sector Leads Early Gains in Pre-market Trading", source: "CNBC", time: "45m ago", impact: "Medium" },
        { id: 4, title: "Oil Prices Retreat on Demand Concerns from Asia", source: "WSJ", time: "1h ago", impact: "High" },
        { id: 5, title: "Gold Prices Hold Near Record Highs Amid Geopolitical Tensions", source: "Reuters", time: "2h ago", impact: "Medium" }
      ];
      res.json(headlines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch headlines" });
    }
  });

  // Fear and Greed Index Proxy
  app.get("/api/fear-greed", async (req, res) => {
    try {
      // Mocking the index value (0-100)
      // In a real app, this would scrape CNN or use a financial API
      const value = 62; // Greed
      const sentiment = value > 75 ? "Extreme Greed" : value > 55 ? "Greed" : value > 45 ? "Neutral" : value > 25 ? "Fear" : "Extreme Fear";
      res.json({ value, sentiment, lastUpdated: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fear and greed index" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
