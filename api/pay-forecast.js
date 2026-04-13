export default async function handler(req,res){

const { city, specialty } = req.query

const historyRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/market-history`
)

const history = await historyRes.json()

const filtered = history.filter(
d => d.city === city && d.specialty === specialty
)

if(filtered.length < 3){

return res.json({
forecast:null,
message:"Insufficient historical data"
})

}

let trend = 0

for(let i=1;i<filtered.length;i++){

trend += filtered[i].avgPay - filtered[i-1].avgPay

}

const avgTrend = trend/(filtered.length-1)

const forecast =
filtered[filtered.length-1].avgPay + avgTrend

res.json({

city,
specialty,
forecast:Math.round(forecast)

})

}
