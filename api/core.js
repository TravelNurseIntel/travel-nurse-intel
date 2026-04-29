import { query } from "./db.js"

// ==========================
// 🔐 RATE LIMIT + USAGE TRACK
// ==========================
const RATE_LIMIT = 100 // requests per day per key

async function trackUsage(apiKey) {

const result = await query(
`INSERT INTO api_usage (api_key, requests, last_used)
VALUES ($1, 1, NOW())
ON CONFLICT (api_key)
DO UPDATE SET
requests = api_usage.requests + 1,
last_used = NOW()
RETURNING requests`,
[apiKey]
)

return result.rows[0].requests
}

// ==========================
// 🔑 VERIFY API KEY
// ==========================
async function verifyKey(req) {

const apiKey = req.headers["x-api-key"]

if (!apiKey) return null

const result = await query(
`SELECT * FROM api_keys WHERE key = $1`,
[apiKey]
)

if (result.rows.length === 0) return null

const usage = await trackUsage(apiKey)

if (usage > RATE_LIMIT) {
throw new Error("Rate limit exceeded")
}

return result.rows[0]
}

// ==========================
// 📊 CORE HANDLER
// ==========================
export default async function handler(req, res) {

try {

const { type } = req.query

// Fetch contracts
const contractsRes = await query(`SELECT * FROM contracts_dataset`)
const contracts = contractsRes.rows

// ==========================
// 📥 JOB INGEST (MERGED)
// ==========================
if (type === "ingest" && req.method === "POST") {

const body = req.body

await query(
`INSERT INTO contracts_dataset
(city,state,specialty,weekly_pay,contract_length,stipend,shift_type,hours_per_week,hospital_type,source,submission_date)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
[
body.city,
body.state,
body.specialty,
body.weeklyPay,
body.contractLength,
body.stipend,
body.shiftType,
body.hoursPerWeek,
body.hospitalType,
"api"
]
)

return res.status(200).json({ success: true })
}

// ==========================
// 📊 MARKET DATA
// ==========================
if (type === "market") {

const map = {}

contracts.forEach(c => {

const key = `${c.city}-${c.state}-${c.specialty}`

if (!map[key]) {
map[key] = { city: c.city, state: c.state, specialty: c.specialty, count: 0, pay: 0 }
}

map[key].count++
map[key].pay += c.weekly_pay || 0

})

return res.status(200).json(
Object.values(map).map(m => ({
city: m.city,
state: m.state,
specialty: m.specialty,
averagePay: Math.round(m.pay / m.count),
contracts: m.count
}))
)
}

// ==========================
// 🤖 PAY PREDICTION
// ==========================
if (type === "predict") {

const user = await verifyKey(req)
if (!user) return res.status(403).json({ error: "Unauthorized" })

const { city, specialty } = req.query

const relevant = contracts.filter(c =>
c.city === city && c.specialty === specialty
)

const avg =
relevant.reduce((sum, c) => sum + c.weekly_pay, 0) /
(relevant.length || 1)

const multiplier = Math.min(relevant.length / 10, 1)

return res.status(200).json({
recommendedPay: Math.round(avg * (1 + multiplier * 0.25)),
confidence: Math.min(relevant.length / 20, 1)
})
}

// ==========================
// 📈 CONTRACT ANALYSIS
// ==========================
if (type === "analyze") {

const { pay } = req.query

const avg =
contracts.reduce((sum, c) => sum + c.weekly_pay, 0) /
(contracts.length || 1)

return res.status(200).json({
marketAverage: Math.round(avg),
score: Math.round((pay / avg) * 100)
})
}

// ==========================
return res.status(400).json({ error: "Invalid type" })

} catch (err) {

console.error(err)

if (err.message.includes("Rate limit")) {
return res.status(429).json({ error: err.message })
}

return res.status(500).json({ error: "Server error" })

}

}
