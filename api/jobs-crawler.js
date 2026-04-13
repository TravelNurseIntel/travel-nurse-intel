export default async function handler(req,res){

const sources = [
"https://example-hospital-feed.com/jobs.json"
]

let jobs = []

for(const url of sources){

try{

const response = await fetch(url)

const data = await response.json()

jobs.push(...data)

}catch(err){

console.log("Feed failed:",url)

}

}

const normalized = jobs.map(job => ({

title:job.title || "Travel Nurse",
hospital:job.hospital || "Hospital",
city:job.city,
state:job.state,
specialty:job.specialty,
pay:Number(job.pay || 0),
source:"partner-feed"

}))

res.status(200).json(normalized)

}
