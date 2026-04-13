import { query } from "./db.js"

export default async function handler(req,res){

const {city,specialty} = req.query

const result = await query(

`SELECT weekly_pay
FROM contracts_dataset
WHERE city=$1
AND specialty=$2
ORDER BY submission_date DESC
LIMIT 50`,

[city,specialty]

)

const pays = result.rows.map(r=>r.weekly_pay)

if(pays.length === 0){

return res.json({forecast:null})

}

const avg =
pays.reduce((a,b)=>a+b,0) / pays.length

const forecast =
Math.round(avg * 1.05)

res.json({

city,
specialty,
forecast

})

}
