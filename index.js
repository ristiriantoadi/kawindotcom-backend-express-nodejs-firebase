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
    req.decodedToken = decodedToken
    next()
  })
  .catch((error) => {
    // Handle error
    console.log("error",error)
    return res.json({
      'message':"invalid id token",
    })
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

app.post('/acara/baru', verifyToken, (req, res) => {
    var db = admin.database();
    var acaraRef = db.ref("/acara");
    acaraRef.push().set({
        "namaPria": req.body.namaPria,
        "namaWanita":req.body.namaWanita,
        "latitude":req.body.latitude,
        "longitude": req.body.longitude,
        "dresscode": req.body.dresscode,
        "waktuAcara": req.body.waktuAcara,
        "userEmail":req.decodedToken.email
    });

    return res.json({
      'message':"acara baru ditambahkan",
    })
})

app.post('/acara/:idAcara/edit', verifyToken, (req, res) => {
  var db = admin.database();
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      acaraRef.update({
        "namaPria": req.body.namaPria,
        "namaWanita":req.body.namaWanita,
        "latitude":req.body.latitude,
        "longitude": req.body.longitude,
        "dresscode": req.body.dresscode,
        "waktuAcara": req.body.waktuAcara
      });
      return res.json({
        'message':"acara berhasil diedit",
      })
    }else{
      return res.json({
        'message':"user tidak memiliki hak mengedit acara yang dibuat user lain",
      })
    }
  });
})

app.post('/acara/:idAcara/delete', verifyToken, (req, res) => {
  //delete acara
  var db = admin.database();
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      acaraRef.remove()
      .then(()=>{
        return res.json({
          'message':"acara berhasil dihapus",
        })  
      })
      .catch(function(error) {
        console.log('Error deleting data:', error);
        // res.send({ status: 'error', error: error });
        return res.json({
          'message': "error hapus data",
        })  
      });
    }else{
      return res.json({
        'message':"user tidak memiliki hak menghapus acara yang dibuat user lain",
      })
    }
  });
})

app.post('/acara/:idAcara/invitee/baru', verifyToken, (req, res) => {
  var db = admin.database();
  // var acaraRef = db.ref("/acara/"+req.params.idAcara+"/invitees");
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      acaraRef = db.ref("/acara/"+req.params.idAcara+"/invitees");
      req.body.invitees.forEach((invitee)=>{
        acaraRef.push().set({
          "namaLengkap": invitee.namaLengkap,
          "email": invitee.email
        });    
      });
      return res.json({
        'message':"invitees ditambahkan",
      })
    }else{
      return res.json({
        'message':"user tidak memiliki hak menambahkan invitees untuk acara yang dibuat user lain",
      })
    }
  });
  // req.body.invitees.forEach((invitee)=>{
  //     acaraRef.push().set({
  //         "namaLengkap": invitee.namaLengkap,
  //         "email": invitee.email
  //     });    
  
  // });
  // return res.json({
  //   'message':"invitees ditambahkan",
  // })
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})