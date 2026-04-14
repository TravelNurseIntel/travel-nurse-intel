import { query } from "./db.js"

export default async function handler(req, res) {

const { type } = req.query

try {

if (type === "pay") {

const result = await query(`
SELECT city, specialty,
ROUND(AVG(weekly_pay)) AS averagePay
FROM contracts_dataset
GROUP BY city, specialty
ORDER BY averagePay DESC
LIMIT 100
`)

return res.json(result.rows)

}

if (type === "shortage") {

const result = await query(`
SELECT city, specialty,
COUNT(*) * 1.0 / 10 AS shortageIndex
FROM contracts_dataset
GROUP BY city, specialty
ORDER BY shortageIndex DESC
LIMIT 100
`)

return res.json(result.rows)

}

if (type === "fill") {

return res.json([
{ specialty: "ICU", avgFillDays: 14 },
{ specialty: "ER", avgFillDays: 12 },
{ specialty: "L&D", avgFillDays: 10 }
])

}

if (type === "forecast") {

const result = await query(`
SELECT city, specialty,
ROUND(AVG(weekly_pay) * 1.05) AS forecast
FROM contracts_dataset
GROUP BY city, specialty
LIMIT 50
`)

return res.json(result.rows)

}

return res.status(400).json({ error: "Invalid type" })

} catch (err) {

console.error(err)

res.status(500).json({ error: "Server error" })

}

}
