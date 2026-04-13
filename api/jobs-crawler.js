export default async function handler(req, res) {

try {

const approvedFeeds = [

/*
Only place feeds here that you have permission to access
Examples:
"https://hospital-system.com/travel-nurse-jobs.json"
"https://partner-agency.com/api/contracts"
*/

"https://example-hospital-feed.com/jobs.json"

]

let crawledJobs = []

for (const url of approvedFeeds) {

try {

const response = await fetch(url)

if(!response.ok){
console.log("Feed unavailable:", url)
continue
}

const data = await response.json()

if(Array.isArray(data)){

data.forEach(job => {

crawledJobs.push({

title: job.title || "Travel Nurse",
hospital: job.hospital || job.company || "Hospital",
city: job.city || "",
state: job.state || "",
specialty: job.specialty || "General",
weeklyPay: Number(job.weeklyPay || job.pay || 0),
contractLength: Number(job.contractLength || 13),
stipend: Number(job.stipend || 0),
shiftType: job.shiftType || "",
hoursPerWeek: Number(job.hoursPerWeek || 36),
hospitalType: job.hospitalType || "hospital",
source: "approved-feed",
submissionDate: new Date().toISOString()

})

})

}

} catch(feedError){

console.log("Feed error:", url)

}

}

if(!global.crawledJobs){
global.crawledJobs = []
}

global.crawledJobs.push(...crawledJobs)

res.status(200).json({

status:"crawler complete",
feedsChecked: approvedFeeds.length,
jobsCollected: crawledJobs.length

})

} catch(error){

console.error("Crawler failure:", error)

res.status(500).json({
error:"Crawler failed"
})

}

}
