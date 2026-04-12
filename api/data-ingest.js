export default async function handler(req,res){

let collected = []

// Example partner feed structure
const feeds = [

process.env.VIVIAN_FEED,
process.env.NOMAD_FEED,
process.env.AYA_FEED,
process.env.TRUSTED_FEED

].filter(Boolean)

for(const url of feeds){

try{

const r = await fetch(url)
const data = await r.json()

data.jobs.forEach(job=>{

collected.push({

title: job.title,
city: job.city,
state: job.state,
specialty: job.specialty,
weeklyPay: job.weeklyPay,
hospital: job.hospital || "Unknown",
source: url

})

})

}catch(err){

console.log("Feed error",url)

}

}

res.status(200).json({
jobsCollected: collected.length,
jobs: collected
})

}
