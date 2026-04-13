export default async function handler(req,res){

try{

const base =
process.env.VERCEL_URL
? "https://" + process.env.VERCEL_URL
: "http://localhost:3000"

let dataset = []

/* ------------------------------------
1. INTERNAL CONTRACT SUBMISSIONS
------------------------------------ */

try{

const contractsRes = await fetch(`${base}/api/contracts`)
const contracts = await contractsRes.json()

contracts.forEach(c=>{

dataset.push({

title:"Travel Nurse",
hospital:c.hospital || "Hospital",
city:c.city,
state:c.state || "",
specialty:c.specialty,
weeklyPay:Number(c.weeklyPay || c.pay || 0),
contractLength:Number(c.contractLength || 13),
stipend:Number(c.stipend || 0),
shiftType:c.shiftType || "",
hoursPerWeek:Number(c.hoursPerWeek || 36),
hospitalType:c.hospitalType || "hospital",
source:"nurse-submission",
submissionDate:c.submissionDate || new Date().toISOString()

})

})

}catch(err){

console.log("Contracts feed failed")

}

/* ------------------------------------
2. RECRUITER JOB POSTINGS
------------------------------------ */

try{

const jobsRes = await fetch(`${base}/api/jobs`)
const jobs = await jobsRes.json()

jobs.forEach(job=>{

dataset.push({

title:job.title || "Travel Nurse",
hospital:job.hospital || "Hospital",
city:job.city,
state:job.state || "",
specialty:job.specialty,
weeklyPay:Number(job.pay || 0),
contractLength:13,
stipend:0,
shiftType:"",
hoursPerWeek:36,
hospitalType:"hospital",
source:"recruiter-posting",
submissionDate:new Date().toISOString()

})

})

}catch(err){

console.log("Recruiter jobs feed failed")

}

/* ------------------------------------
3. APPROVED PARTNER FEEDS
------------------------------------ */

const partnerFeeds = [

/* Only include feeds you have permission for */

"https://example-hospital-feed.com/jobs.json"

]

for(const url of partnerFeeds){

try{

const response = await fetch(url)

if(!response.ok){
console.log("Feed unavailable:",url)
continue
}

const data = await response.json()

if(Array.isArray(data)){

data.forEach(job=>{

dataset.push({

title:job.title || "Travel Nurse",
hospital:job.hospital || "Hospital",
city:job.city || "",
state:job.state || "",
specialty:job.specialty || "General",
weeklyPay:Number(job.weeklyPay || job.pay || 0),
contractLength:Number(job.contractLength || 13),
stipend:Number(job.stipend || 0),
shiftType:job.shiftType || "",
hoursPerWeek:Number(job.hoursPerWeek || 36),
hospitalType:job.hospitalType || "hospital",
source:"partner-feed",
submissionDate:new Date().toISOString()

})

})

}

}catch(err){

console.log("Feed error:",url)

}

}

/* ------------------------------------
4. SAVE TO MEMORY DATASET
------------------------------------ */

if(!global.nationalJobs){
global.nationalJobs = []
}

global.nationalJobs.push(...dataset)

/* Remove duplicates */

const unique = Array.from(
new Map(dataset.map(job=>[
`${job.city}-${job.specialty}-${job.weeklyPay}`,
job
])).values()
)

res.status(200).json({

status:"crawler complete",
recordsCollected:unique.length

})

}catch(error){

console.error("Crawler failure:",error)

res.status(500).json({
error:"crawler failed"
})

}

}
