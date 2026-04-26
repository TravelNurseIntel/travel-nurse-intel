export default async function handler(req,res){

const { city, specialty } = req.query

if(!city || !specialty){
return res.status(400).json({error:"Missing parameters"})
}

// Fetch contracts
const baseUrl = process.env.VERCEL_URL
? "https://" + process.env.VERCEL_URL
: ""

const response = await fetch(baseUrl + "/api/contracts")
const contracts = await response.json()

// Filter relevant market
const relevant = contracts.filter(c =>
c.city?.toLowerCase() === city.toLowerCase() &&
c.specialty?.toLowerCase() === specialty.toLowerCase()
)

if(relevant.length === 0){
return res.status(200).json({recommendedPay: 2500})
}

// Calculate avg
const avg = relevant.reduce((sum,c)=>sum+(c.weeklyPay||0),0) / relevant.length

// Demand multiplier
const demandFactor = Math.min(relevant.length / 10, 1)

// Final prediction
const recommendedPay = Math.round(avg * (1 + demandFactor * 0.2))

res.status(200).json({
recommendedPay,
confidence: Math.min(relevant.length / 20, 1)
})

}
