import fetch from "node-fetch"

export default async function handler(req,res){

const feeds = [

"https://api.nomadhealth.com/jobs",
"https://api.vivian.com/jobs"

]

let jobs = []

for(const url of feeds){

const response = await fetch(url)
const data = await response.json()

jobs.push(...data)

}

res.status(200).json({ jobs })

}
