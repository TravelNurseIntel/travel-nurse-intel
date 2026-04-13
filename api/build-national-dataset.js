export default async function handler(req,res){

let dataset = []

// Pull contracts from platform

const contractsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/contracts`
)

const contracts = await contractsRes.json()

contracts.forEach(c => {

dataset.push({

city:c.city,
state:c.state,
region:c.region,
country:c.country,
specialty:c.specialty,
weeklyPay:c.weeklyPay,
contractLength:c.contractLength,
shiftType:c.shiftType,
hoursPerWeek:c.hoursPerWeek,
hospitalType:c.hospitalType,
source:"contract_submission",
submissionDate:c.submissionDate

})

})

// Pull recruiter job postings

const jobsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/jobs`
)

const jobs = await jobsRes.json()

jobs.forEach(job => {

dataset.push({

city:job.city,
state:job.state || "",
region:"",
country:"USA",
specialty:job.specialty,
weeklyPay:job.pay || 0,
contractLength:13,
shiftType:"",
hoursPerWeek:36,
hospitalType:"hospital",
source:"recruiter_job",
submissionDate:new Date().toISOString()

})

})

res.status(200).json({

records:dataset.length,
dataset

})

}
