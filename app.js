const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running!!!')
    })
  } catch (e) {
    console.log(`Error is : ${e.message}`)
    process.exit(1)
  }
}
initializeServer()
const responseObjPlayer = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}
app.get('/players/', async (request, response) => {
  const query1 = `SELECT * FROM player_details`
  const result1 = await db.all(query1)
  console.log(result1)
  response.send(result1.map(eachArr1 => responseObjPlayer(eachArr1)))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  console.log({playerId})
  const query2 = `SELECT * FROM player_details 
  WHERE player_id = ${playerId}`
  const result2 = await db.get(query2)
  response.send(responseObjPlayer(result2))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  let query3 = `
  UPDATE player_details
  SET
  player_name = '${playerName}'
  WHERE 
  player_id = ${playerId}`
  await db.run(query3)
  response.send('Player Details Updated')
})
const matchToResponseObj = dbObj => {
  return {
    matchId: dbObj.match_id,
    match: dbObj.match,
    year: dbObj.year,
  }
}
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  console.log(matchId)
  let query4 = `SELECT * FROM  match_details
  WHERE match_id = ${matchId}`
  let result4 = await db.get(query4)
  response.send(matchToResponseObj(result4))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const query5 = `SELECT match_id,match,year FROM  match_details NATURAL JOIN player_match_score
                  WHERE player_id = ${playerId}`
  const result5 = await db.all(query5)
  response.send(result5.map(eachDetail => matchToResponseObj(eachDetail)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const query6 = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`
  const result6 = await db.all(query6)
  response.send(result6.map(eachDet => responseObjPlayer(eachDet)))
})

const displayResultTotal = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
    totalScore: dbObj['sum(score)'],
    totalFours: dbObj['sum(fours)'],
    totalSixes: dbObj['sum(sixes)'],
  }
}
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId1} = request.params
  const query7 = `
  SELECT player_id,player_name,sum(score),sum(fours),sum(sixes)
  FROM player_details NATURAL JOIN player_match_score
  WHERE player_id = ${playerId1}`
  const result7 = await db.all(query7)
  response.send(displayResultTotal(result7))
})
module.exports = app
