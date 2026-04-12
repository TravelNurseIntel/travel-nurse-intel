export default async function handler(req,res){

const contractsRes = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/contracts`)
const contracts = await contractsRes.json()

const payMap = {}

contracts.forEach(c => {

const key = `${c.city}-${c.specialty}`

if(!payMap[key]){

payMap[key] = {
city:c.city,
specialty:c.specialty,
pays:[]
}

}

payMap[key].pays.push(Number(c.pay))

})

const results = Object.values(payMap).map(item=>{

const avg = item.pays.reduce((a,b)=>a+b,0) / item.pays.length

return{
city:item.city,
specialty:item.specialty,
averagePay: Math.round(avg)
}

})

res.status(200).json(results)

}
