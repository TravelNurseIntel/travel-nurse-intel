export default async function handler(req, res) {

const contractsRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/contracts`)
const contracts = await contractsRes.json()

const jobsRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/jobs`)
const jobs = await jobsRes.json()

const shortageMap = {}

jobs.forEach(job => {

const key = `${job.city}-${job.specialty}`

if(!shortageMap[key]){

shortageMap[key] = {
city: job.city,
specialty: job.specialty,
jobs: 0,
contracts: 0
}

}

shortageMap[key].jobs++

})

contracts.forEach(contract => {

const key = `${contract.city}-${contract.specialty}`

if(shortageMap[key]){

shortageMap[key].contracts++

}

})

const result = Object.values(shortageMap).map(item => {

const shortageIndex = item.jobs / Math.max(item.contracts,1)

return {
city: item.city,
specialty: item.specialty,
shortageIndex: Number(shortageIndex.toFixed(2))
}

})

res.status(200).json(result)

}
