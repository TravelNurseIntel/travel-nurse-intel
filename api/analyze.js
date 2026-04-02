export default function handler(req, res) {

const { hourly, hours, stipend } = req.body

const weekly = hourly * hours + stipend

const market = 2850

let score = 60

if(weekly >= market + 300) score = 95
else if(weekly >= market + 100) score = 85
else if(weekly >= market - 100) score = 75
else if(weekly >= market - 300) score = 60
else score = 45

res.status(200).json({
weeklyPay: weekly,
score: score
})

}
