export default async function handler(req,res){

const contractsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/contracts`
)

const contracts = await contractsRes.json()

let snapshot = {}

contracts.forEach(contract => {

const key = `${contract.city}-${contract.specialty}`

if(!snapshot[key]){

snapshot[key] = {
city:contract.city,
state:contract.state,
specialty:contract.specialty,
count:0,
totalPay:0
}

}

snapshot[key].count++
snapshot[key].totalPay += contract.weeklyPay

})

const results = Object.values(snapshot).map(item => {

return {

city:item.city,
state:item.state,
specialty:item.specialty,
avgPay: Math.round(item.totalPay / item.count),
contracts:item.count,
snapshotDate:new Date().toISOString()

}

})

if(!global.marketSnapshots){
global.marketSnapshots = []
}

global.marketSnapshots.push(...results)

res.status(200).json({
saved:results.length
})

}
