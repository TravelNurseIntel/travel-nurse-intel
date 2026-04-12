export default function handler(req,res){

const { specialty, state } = req.query

const basePay = {
ICU: 3200,
ER: 3000,
"Labor & Delivery": 3400,
OR: 3300
}

const locationMultiplier = {
CA:1.15,
WA:1.12,
TX:1.00,
FL:0.95
}

const pay = basePay[specialty] * locationMultiplier[state]

res.status(200).json({
predictedPay: Math.round(pay)
})

}
