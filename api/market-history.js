export default async function handler(req,res){

if(!global.marketSnapshots){
global.marketSnapshots = []
}

res.status(200).json(global.marketSnapshots)

}
