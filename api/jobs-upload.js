import csv from "csv-parser"
import { Readable } from "stream"

export default async function handler(req, res) {

if (req.method !== "POST") {
return res.status(405).json({ error: "Only POST allowed" })
}

const jobs = []

const stream = Readable.from(req.body)

stream
.pipe(csv())
.on("data", (row) => {

jobs.push({
title: row.title,
city: row.city,
state: row.state,
specialty: row.specialty,
weeklyPay: row.pay,
hospital: row.hospital,
created: new Date().toISOString()
})

})
.on("end", () => {

console.log("Bulk Jobs Uploaded:", jobs.length)

res.status(200).json({
success: true,
uploaded: jobs.length
})

})

}
