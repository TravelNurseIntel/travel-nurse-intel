export default async function handler(req, res) {

if (!global.contracts) {
global.contracts = []
}

if (req.method === "GET") {

return res.status(200).json(global.contracts)

}

if (req.method === "POST") {

try {

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

const newContract = {

city: city || "",
state: state || "",
specialty: specialty || "",
weeklyPay: Number(weeklyPay) || 0,
contractLength: Number(contractLength) || 13,
stipend: Number(stipend) || 0,
shiftType: shiftType || "day",
hoursPerWeek: Number(hoursPerWeek) || 36,
hospitalType: hospitalType || "hospital",
submissionDate: new Date().toISOString()

}

global.contracts.push(newContract)

return res.status(200).json({
success: true,
contract: newContract
})

} catch (err) {

return res.status(500).json({
error: "Contract submission failed"
})

}

}

res.status(405).json({ error: "Method not allowed" })

}
