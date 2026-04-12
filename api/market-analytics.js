export default async function handler(req,res){

const dataRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/process-market-data`
)

const markets = await dataRes.json()

const analytics = markets.map(m=>{

let demandScore = Math.min(100, m.contracts * 5)

return{

city:m.city,
specialty:m.specialty,
averagePay:m.avgPay,
demandScore

}

})

res.status(200).json(analytics)

}
