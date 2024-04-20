const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const snakeToCamel = newObject => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  }
}

const districtSnakeToCamel = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}
const reportSnakeToCamelCase = newObject => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  }
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//API1

app.get('/states/', async (request, response) => {
  const allStates = `
    SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`
  const states = await db.all(allStates)
  const result = states.map(eachState => {
    return snakeToCamel(eachState)
  })
  response.send(result)
})

//API2

app.get('/states/:statesId', async (request, response) => {
  const {stateId} = request.params
  const getState = `
    SELECT
      *
    FROM
      state
    WHERE state_id=${stateId};`
  const newState = await db.get(getState)
  const result = snakeToCamel(newState)
  response.send(result)
})

//API3

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createDistrict
  const newDistrict = `
    INSERT INTO
      district (district_name,state_id,cases,cured,active,deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
        '${deaths}'
      );`

  const addDistrict = await db.run(newDistrict)
  const districtId = addDistrict.lastID
  response.send('District Successfully Added')
})

//API4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`
  const newDistrict = await db.get(getDistrict)
  const result = districtSnakeToCamel(newDistrict)
  response.send(result)
})

//API5
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`
  await db.run(deleteDistrict)
  response.send('District Removed')
})

//API6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrict = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    WHERE
      district_id = ${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//API7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateReport = `
    SELECT
     SUM(cases),
     SUM(cured),
     SUM(active),
     SUM(deaths)
    FROM
     district
    WHERE
      state_id = ${stateId};`
  const stateReport = await db.all(getStateReport)
  console.log(stateReport)

  response.send({
    totalCases: stateReport['SUM(cases)'],
    totalCured: stateReport['SUM(cured)'],
    totalActive: stateReport['SUM(active)'],
    totalDeaths: stateReport['SUM(deaths)'],
  })
})

//API8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    ` //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    ` //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
}) //sending the required response

module.exports = app
