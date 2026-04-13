import { query } from "./db.js"

export default async function handler(req, res) {

try {

if (req.method === "GET") {

const result = await query(
`SELECT * FROM contracts_dataset
ORDER BY submission_date DESC
LIMIT 200`
)

return res.status(200).json(result.rows)

}

if (req.method === "POST") {

const {
city,
state,
specialty,
weeklyPay,
contractLength,
stipend,
shiftType,
hoursPerWeek,
hospitalType
} = req.body

const regions = {
AZ:"Southwest",
CA:"West",
TX:"South",
WA:"West",
FL:"South",
NY:"Northeast",
MA:"Northeast",
IL:"Midwest"
}

await query(

`INSERT INTO contracts_dataset
(city,state,region,country,specialty,
weekly_pay,contract_length,stipend,
shift_type,hours_per_week,hospital_type,
source,submission_date)

VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())`,

[
city || "",
state || "",
regions[state] || "Unknown",
"USA",
specialty || "",

Number(weeklyPay) || 0,
Number(contractLength) || 13,
Number(stipend) || 0,

shiftType || "day",
Number(hoursPerWeek) || 36,
hospitalType || "hospital",

"user-submission"
]

)

return res.status(200).json({
success:true
})

}

return res.status(405).json({ error:"Method not allowed" })

} catch (error) {

console.error(error)

return res.status(500).json({
error:"Contract submission failed"
})

}

}
