import verifyKey from "./verify-key.js"

export default async function handler(req, res) {

try{

// 🔐 AUTH CHECK
const user = await verifyKey(req)

if(!user){
return res.status(403).json({ error: "Unauthorized" })
}

// 📥 INPUT
const { city, specialty } = req.query

if(!city || !specialty){
return res.status(400).json({ error: "Missing parameters" })
}

// 🌐 BASE URL (safe for Vercel)
const baseUrl = process.env.VERCEL_URL
  ? "https://" + process.env.VERCEL_URL
  : "http://localhost:3000"

// 📡 FETCH CONTRACTS
const response = await fetch(`${baseUrl}/api/contracts`)

if(!response.ok){
throw new Error("Failed to fetch contracts")
}

const contracts = await response.json()

// 🔍 FILTER MARKET
const relevant = contracts.filter(c =>
(c.city || "").toLowerCase() === city.toLowerCase() &&
(c.specialty || "").toLowerCase() === specialty.toLowerCase()
)

// 🧠 FALLBACK
if(relevant.length === 0){
return res.status(200).json({
recommendedPay: 2500,
confidence: 0
})
}

// 📊 CALCULATIONS
const avg = relevant.reduce((sum,c)=> sum + (c.weeklyPay || 0), 0) / relevant.length

const demandFactor = Math.min(relevant.length / 10, 1)

const recommendedPay = Math.round(avg * (1 + demandFactor * 0.2))

// ✅ RESPONSE
return res.status(200).json({
recommendedPay,
confidence: Math.min(relevant.length / 20, 1)
})

}catch(err){

console.error("Prediction error:", err)

return res.status(500).json({
error: "Prediction failed"
})

}

}
