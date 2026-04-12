export default async function handler(req,res){

const { city, specialty, pay } = req.query

const marketRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/process-market-data`
)

const markets = await marketRes.json()

const match = markets.find(m =>
m.city === city && m.specialty === specialty
)

if(!match){

return res.status(200).json({
score:50,
message:"Insufficient market data"
})

}

const avg = match.avgPay

let score = 50

if(pay >= avg * 1.2) score = 95
else if(pay >= avg * 1.1) score = 85
else if(pay >= avg) score = 75
else if(pay >= avg * .9) score = 60
else score = 40

res.status(200).json({

score,
marketAverage:avg,
message:
score >= 85 ? "Excellent contract"
: score >= 70 ? "Competitive contract"
: score >= 60 ? "Average pay"
: "Below market pay"

})

}
