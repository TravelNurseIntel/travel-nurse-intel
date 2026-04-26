import { query } from "./db.js"

export default async function verifyKey(req){

const apiKey = req.headers["x-api-key"]

if(!apiKey) return null

const result = await query(
`SELECT * FROM api_keys WHERE api_key = $1`,
[apiKey]
)

return result.rows[0] || null

}
