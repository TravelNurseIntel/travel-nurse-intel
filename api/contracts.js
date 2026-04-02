import { kv } from '@vercel/kv'

export default async function handler(req, res) {

if (req.method === "POST") {

const { city, specialty, pay } = req.body

const entry = {
id: Date.now(),
city,
specialty,
pay,
timestamp: new Date().toISOString()
}

await kv.lpush("contracts", JSON.stringify(entry))

const latest = await kv.lrange("contracts", 0, 20)

res.status(200).json(latest.map(x => JSON.parse(x)))

}

else {

const latest = await kv.lrange("contracts", 0, 20)

res.status(200).json(latest.map(x => JSON.parse(x)))

}

}
