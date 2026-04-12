export default async function handler(req, res) {

const sources = [

"https://api.vivian.com/jobs",
"https://api.nomadhealth.com/jobs"

]

let jobs = []

for (const url of sources) {

try {

const response = await fetch(url)

const data = await response.json()

jobs.push(...data)

} catch(err){

console.log("Feed failed:", url)

}

}

const normalized = jobs.map(job => ({

title: job.title || "Travel Nurse",
hospital: job.company || "Hospital",
city: job.city,
state: job.state,
specialty: job.specialty,
pay: job.pay || 0,
source: "external-feed"

}))

res.status(200).json(normalized)

}
