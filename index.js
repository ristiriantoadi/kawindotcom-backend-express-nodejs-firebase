const express = require('express')
const app = express()
const port = process.env.PORT || 5000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/acara/baru', (req, res) => {
    // res.send('Acara baru!')
    // res.send("Name: "+req.body.name)
    // console.log("Name: "+req.body.name)
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})