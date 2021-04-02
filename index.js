const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const https = require('https')
const path = require('path');

var admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://angular-96299.firebaseio.com"
});

app.use(express.json())

//middleware function
function verifyToken(req,res,next){
  const idToken = req.headers['id-token'] // get firebase id token
  console.log("idToken",idToken)
  // idToken comes from the client app
  admin
  .auth()
  .verifyIdToken(idToken)
  .then((decodedToken) => {
    const uid = decodedToken.uid;
    // console.log("decodedToken", decodedToken)
    // ...
    req.decodedToken = decodedToken
    next()
  })
  .catch((error) => {
    // Handle error
    console.log("error",error)
  });
}


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/dashboard',verifyToken, (req, res) => {
  console.log("req decodedToken",req.decodedToken)
  return res.json({
    'message':"this is dashboard",
    'your-email':req.decodedToken.email
  })
})

app.post('/acara/:idAcara/invitee/baru', (req, res) => {
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

app.post('/register', (req, res) => {
  var email = req.body.email
  var password = req.body.password

  const data = JSON.stringify({
    email,
    password,
    returnSecureToken: true
  })
//   curl 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[API_KEY]' \
// -H 'Content-Type: application/json' \
// --data-binary '{"email":"[user@example.com]","password":"[PASSWORD]","returnSecureToken":true}'

  const options = {
    hostname: 'identitytoolkit.googleapis.com',
    port: 443,
    path: '/v1/accounts:signUp?key=AIzaSyAWIsYFgzYWklXThsgMOTI5d7TdGe_acUw',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  
  const request = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      process.stdout.write(d)
    })
  })
  
  request.on('error', error => {
    console.error(error)
  })
  
  request.write(data)
  request.end()
})

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname + '/register.html'));
})


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname + '/login.html'));
})

app.post('/logout', (req, res) => {
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})