export default async function handler(req,res){

const contractsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/contracts`
)

const contracts = await contractsRes.json()

let stats = {}

contracts.forEach(c=>{

const key = `${c.city}-${c.specialty}`

if(!stats[key]){

stats[key] = {
city:c.city,
specialty:c.specialty,
count:0,
totalPay:0
}

}

stats[key].count++
stats[key].totalPay += Number(c.pay)

})

const processed = Object.values(stats).map(item=>{

return{

city:item.city,
specialty:item.specialty,
avgPay:Math.round(item.totalPay/item.count),
contracts:item.count

}

})

res.status(200).json(processed)

}
