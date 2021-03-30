const express = require('express')
const app = express()
const port = process.env.PORT || 5000

var admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://angular-96299.firebaseio.com"
});

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/acara/:idAcara/invitee/baru', (req, res) => {
    // console.log(req.body.invitees)
    var db = admin.database();
    var acaraRef = db.ref("/acara/"+req.params.idAcara+"/invitees");
    req.body.invitees.forEach((invitee)=>{
        acaraRef.push().set({
            "namaLengkap": invitee.namaLengkap,
            "email": invitee.email
        });    
    
    });

})

app.post('/acara/baru', (req, res) => {
    var db = admin.database();
    var acaraRef = db.ref("/acara");
    acaraRef.push().set({
        "namaPria": req.body.namaPria,
        "namaWanita":req.body.namaWanita,
        "latitude":req.body.latitude,
        "longitude": req.body.longitude,
        "dresscode": req.body.dresscode,
        "waktuAcara": req.body.waktuAcara
    });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})