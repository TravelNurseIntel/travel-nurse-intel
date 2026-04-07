export default async function handler(req, res) {

if (req.method === "POST") {

const job = req.body

if (!job.title || !job.city || !job.pay) {
return res.status(400).json({ error: "Missing required fields" })
}

const jobRecord = {
title: job.title,
city: job.city,
state: job.state || "",
specialty: job.specialty || "",
weeklyPay: job.pay,
hospital: job.hospital || "",
source: job.source || "ATS",
created: new Date().toISOString()
}

console.log("New Job Posted:", jobRecord)

/*
Future storage options:
- Redis (you already provisioned)
- Postgres
- Supabase
- PlanetScale
*/

return res.status(200).json({
success: true,
message: "Job received",
job: jobRecord
})

}

if (req.method === "GET") {

return res.status(200).json({
message: "Travel Nurse Intel Job Feed API",
endpoint: "/api/jobs",
method: "POST"
})

}

res.status(405).json({ error: "Method not allowed" })

}
