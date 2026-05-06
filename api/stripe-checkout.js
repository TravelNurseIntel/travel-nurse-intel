import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req,res){

try{

const { plan, email } = req.body

const prices = {
starter: "price_STARTER_ID",
standard: "price_STANDARD_ID",
enterprise: "price_ENTERPRISE_ID"
}

const session = await stripe.checkout.sessions.create({
payment_method_types:["card"],
mode:"subscription",
customer_email: email,
line_items:[{
price: prices[plan],
quantity:1
}],
success_url:"https://travelnurseintel.com/success.html",
cancel_url:"https://travelnurseintel.com/cancel.html"
})

res.status(200).json({
url: session.url
})

}catch(err){

console.error(err)

res.status(500).json({
error:"Stripe session failed"
})

}

}
