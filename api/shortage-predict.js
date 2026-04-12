export default async function handler(req,res){

const contractsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/contracts`
)

const jobsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/jobs`
)

const contracts = await contractsRes.json()
const jobs = await jobsRes.json()

let market = {}

jobs.forEach(job => {

const key = `${job.city}-${job.specialty}`

if(!market[key]){
market[key] = {
city:job.city,
specialty:job.specialty,
jobs:0,
contracts:0
}
}

market[key].jobs++

})

contracts.forEach(contract => {

const key = `${contract.city}-${contract.specialty}`

if(market[key]){
market[key].contracts++
}

})

const predictions = Object.values(market).map(m => {

let shortageScore = m.jobs / Math.max(m.contracts,1)

return {

city:m.city,
specialty:m.specialty,
shortageScore:Number(shortageScore.toFixed(2)),

prediction:
shortageScore > 3 ? "Critical shortage"
: shortageScore > 2 ? "High shortage"
: shortageScore > 1 ? "Moderate shortage"
: "Balanced market"

}

})

res.status(200).json(predictions)

}
