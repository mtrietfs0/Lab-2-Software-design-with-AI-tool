import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Auto-Categorization using Gemini API
  app.post("/api/categorize", async (req, res) => {
    try {
      const { note } = req.body;
      if (!note) {
        return res.status(400).json({ error: "Note is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Phân loại ghi chú chi tiêu sau vào một trong các danh mục: "Ăn uống", "Di chuyển", "Mua sắm", "Giải trí", "Hóa đơn", "Khác".
Chỉ trả về đúng tên danh mục, không thêm bất kỳ văn bản nào khác.

Ghi chú: "${note}"
Danh mục:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
        }
      });

      const category = response.text?.trim() || "Khác";
      
      // Ensure the returned category is one of the valid options
      const validCategories = ["Ăn uống", "Di chuyển", "Mua sắm", "Giải trí", "Hóa đơn", "Khác"];
      const finalCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase()) || "Khác";

      res.json({ category: finalCategory });
    } catch (error) {
      console.error("Categorization error:", error);
      res.status(500).json({ error: "Failed to categorize note" });
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
