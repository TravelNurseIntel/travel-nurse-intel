export default async function handler(req,res){

const dataRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/build-national-dataset`
)

const dataset = await dataRes.json()

let stats = {}

dataset.dataset.forEach(record => {

const key = `${record.city}-${record.specialty}`

if(!stats[key]){

stats[key] = {
city:record.city,
specialty:record.specialty,
count:0,
totalPay:0
}

}

stats[key].count++
stats[key].totalPay += Number(record.weeklyPay)

})

const markets = Object.values(stats).map(m => {

return{

city:m.city,
specialty:m.specialty,
contracts:m.count,
avgPay:Math.round(m.totalPay/m.count)

}

})

res.status(200).json(markets)

}
