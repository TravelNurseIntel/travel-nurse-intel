import { kv } from "@vercel/kv";

export default async function handler(req, res) {

  try {

    if (req.method === "POST") {

      const { city, specialty, pay } = req.body;

      const entry = {
        id: Date.now(),
        city,
        specialty,
        pay,
        score: Math.floor(Math.random() * 40) + 60,
        timestamp: new Date().toISOString()
      };

      await kv.lpush("contracts", JSON.stringify(entry));

      const latest = await kv.lrange("contracts", 0, 20);

      return res.status(200).json(latest.map(i => JSON.parse(i)));
    }

    if (req.method === "GET") {

      const latest = await kv.lrange("contracts", 0, 20);

      return res.status(200).json(latest.map(i => JSON.parse(i)));
    }

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Database error",
      message: error.message
    });

  }

}
