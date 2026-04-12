export default async function handler(req,res){

const { city, specialty } = req.query

if(!city || !specialty){

return res.status(400).json({error:"Missing parameters"})

}

const contractsRes = await fetch(
`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/contracts`
)

const contracts = await contractsRes.json()

const filtered = contracts.filter(c =>
c.city?.toLowerCase() === city.toLowerCase() &&
c.specialty?.toLowerCase() === specialty.toLowerCase()
)

if(filtered.length === 0){

return res.status(200).json({
city,
specialty,
pay: "3200"
})

}

const avg =
filtered.reduce((sum,c)=> sum + Number(c.pay || 0),0) /
filtered.length

res.status(200).json({

city,
specialty,
pay: Math.round(avg)

})

}
