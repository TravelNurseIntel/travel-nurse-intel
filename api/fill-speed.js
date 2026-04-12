export default async function handler(req,res){

const jobsRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/jobs`)
const jobs = await jobsRes.json()

const fillStats = {}

jobs.forEach(job => {

if(!job.postDate || !job.fillDate) return

const days = (new Date(job.fillDate) - new Date(job.postDate)) / (1000*60*60*24)

const key = `${job.specialty}`

if(!fillStats[key]){

fillStats[key] = {
specialty: job.specialty,
totalDays:0,
count:0
}

}

fillStats[key].totalDays += days
fillStats[key].count++

})

const result = Object.values(fillStats).map(item => {

return{
specialty:item.specialty,
avgFillDays: Math.round(item.totalDays / item.count)
}

})

res.status(200).json(result)

}
