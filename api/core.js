import verifyKey from "./verify-key.js"

export default async function handler(req, res) {

try {

const { type } = req.query

// Base URL (safe for Vercel)
const baseUrl = process.env.VERCEL_URL
  ? "https://" + process.env.VERCEL_URL
  : "http://localhost:3000"

// Fetch contracts once (shared across features)
const response = await fetch(`${baseUrl}/api/contracts`)

if (!response.ok) {
throw new Error("Failed to fetch contracts")
}

const contracts = await response.json()

// =============================
// 📊 MARKET DATA
// =============================
if (type === "market") {

const map = {}

contracts.forEach(c => {

const key = `${c.city}-${c.state}-${c.specialty}`

if (!map[key]) {
map[key] = {
city: c.city || "-",
state: c.state || "-",
specialty: c.specialty || "-",
count: 0,
pay: 0
}
}

map[key].count++
map[key].pay += (c.weeklyPay || 0)

})

const results = Object.values(map).map(m => ({
city: m.city,
state: m.state,
specialty: m.specialty,
avgPay: Math.round(m.pay / (m.count || 1)),
contracts: m.count
}))

return res.status(200).json(results)
}

// =============================
// 🤖 PAY PREDICTION (PROTECTED)
// =============================
if (type === "predict") {

const user = await verifyKey(req)

if (!user) {
return res.status(403).json({ error: "Unauthorized" })
}

const { city, specialty } = req.query

if (!city || !specialty) {
return res.status(400).json({ error: "Missing parameters" })
}

const relevant = contracts.filter(c =>
(c.city || "").toLowerCase() === city.toLowerCase() &&
(c.specialty || "").toLowerCase() === specialty.toLowerCase()
)

if (relevant.length === 0) {
return res.status(200).json({
recommendedPay: 2500,
confidence: 0
})
}

const avg = relevant.reduce((sum, c) => sum + (c.weeklyPay || 0), 0) / relevant.length

const demandFactor = Math.min(relevant.length / 10, 1)

const recommendedPay = Math.round(avg * (1 + demandFactor * 0.2))

return res.status(200).json({
recommendedPay,
confidence: Math.min(relevant.length / 20, 1)
})
}

// =============================
// 📈 ANALYZE CONTRACT
// =============================
if (type === "analyze") {

const { pay } = req.query

if (!pay) {
return res.status(400).json({ error: "Missing pay value" })
}

const avg = contracts.reduce((sum, c) => sum + (c.weeklyPay || 0), 0) / (contracts.length || 1)

const score = Math.round((pay / avg) * 100)

return res.status(200).json({
marketAverage: Math.round(avg),
score
})
}

// =============================
// ❌ DEFAULT
// =============================
return res.status(400).json({ error: "Invalid type" })

} catch (err) {

console.error("Core API error:", err)

return res.status(500).json({
error: "Server error"
})

}

}
