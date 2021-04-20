const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const https = require('https')
const path = require('path');
const fileUpload = require('express-fileupload');

//setup cors
const cors = require('cors')
app.use(cors())

//firebase setup
var admin = require('firebase-admin');
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://angular-96299.firebaseio.com",
  storageBucket: "angular-96299.appspot.com"
});
var db = admin.database();
var bucket = admin.storage().bucket();


//nodemailer setup
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kawindotcom.undangan@gmail.com',
    pass: 'farhanwilhamadi' // naturally, replace both with your real credentials or an application-specific password
  }
});

app.use(express.json())

// enable files upload  / setup file upload
app.use(fileUpload({
  createParentPath: true
}));

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

app.get('/acara', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara");
  acaraRef.once("value", function(data) {
    var acaraData = []
    for (var key in data.val()) {
      var userEmail = data.val()[key].userEmail
      if(userEmail == req.decodedToken.email){
        var acara  = data.val()[key]
        acara.idAcara = key
        acaraData.push(acara)
      } 
    }
    return res.json({
      "acaras": acaraData
    })
  });
})

app.get('/acara/:idAcara', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      var acara = data.val()
      acara.idAcara = data.key
      return res.json({
        'acara':data.val(),
      })
    }else{
      return res.json({
        'message':"user tidak memiliki hak membaca data acara yang dibuat user lain",
      })
    }
  });
})

app.post('/acara/baru', verifyToken, (req, res) => {
    var acaraRef = db.ref("/acara");
    acaraRef.push().set({
        "namaPria": req.body.namaPria,
        "namaWanita":req.body.namaWanita,
        "latitude":req.body.latitude,
        "longitude": req.body.longitude,
        "dresscode": req.body.dresscode,
        "waktuAcara": req.body.waktuAcara,
        "userEmail":req.decodedToken.email
    })
    .then(()=>{
      return res.json({
        'message':"acara baru ditambahkan",
      })
    })
    .catch(function(error) {
      console.log('Error deleting data:', error);
      return res.json({
        'message': "error buat acara baru",
      })  
    });
})

app.post('/acara/:idAcara/edit', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
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
        })
        .then(()=>{
          return res.json({
            'message':"acara berhasil diedit",
          })
        })
        .catch(function(error) {
          console.log('Error editing data:', error);
          return res.json({
          'message': "error edit acara",
        })  
      });
    }else{
      return res.json({
        'message':"user tidak memiliki hak mengedit acara yang dibuat user lain",
      })
    }
  });
})

app.post('/acara/:idAcara/hapus', verifyToken, (req, res) => {
  //delete acara
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
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

app.get('/acara/:idAcara/gallery/add', (req, res) => {
  //only authenticated user can add new picture to their gallery
  // how many pictures can they add in one go?
  // i mean, each acara have ONE galery. the gallery will have UNLIMITED number of pictures
  //how many pictures each time upload one time?

  //can you add multiple pictures at the same time
  //how

  res.sendFile(path.join(__dirname + '/gallery.html'));

})

app.post('/acara/:idAcara/gallery/add', async (req, res) => {
  try {
    if(!req.files) {
      console.log("error called")
      return res.json({
            status: false,
            message: 'No file uploaded'
        });
    } else {
        let data = []; 
        req.files.photos.forEach((item,index)=>{
          let photo = item;
          const blob = bucket.file(`${req.params.idAcara}/${photo.name}`)
          const blobWriter = blob.createWriteStream({
            metadata: {
                contentType: photo.mimetype
            }
          })
          blobWriter.on('error', (err) => {
            console.log(err)
          })
          blobWriter.on('finish', () => {
            //after this, what do you do
            //you gotta add the link of the file into the acara
            const url = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            // console.log("url",url)

            var acaraRef = db.ref("/acara/"+req.params.idAcara+"/gallery");
            acaraRef.push().update({
              "url":url
            })
            .then(()=>{
              
            })
            .catch(function(error) {
              console.log('Error adding url data:', error); 
            });
          })
          blobWriter.end(photo.buffer)
        });

        //return response
        return res.json({
            status: true,
            message: 'Files are uploaded'
        });
    }
  } catch (err) {
    console.log("err",err)
    res.status(500).send(err);
  }
})

app.post('/acara/:idAcara/invitees/baru', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
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
})

//get invitees
app.get('/acara/:idAcara/invitees', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      var inviteesRef = db.ref("/acara/"+req.params.idAcara+"/invitees");
      inviteesRef.once("value", function(data) {
        var inviteesData = []
        for (var key in data.val()){
          var invitee = data.val()[key]
          invitee.idInvitee = key
          inviteesData.push(invitee)
        }
        return res.json({
          "invitees": inviteesData,
          "idAcara": req.params.idAcara
        })
      });
    }else{
      return res.json({
        'message':"user tidak memiliki hak membaca invitees untuk acara yang dibuat user lain",
      })
    }
  });
})

app.post('/acara/:idAcara/invitees/:idInvitee/edit', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var inviteeRef = db.ref("/acara/"+req.params.idAcara+"/invitees/"+req.params.idInvitee);
    inviteeRef.once("value",function(dataInvitee){
      if(dataInvitee.val() == null){
        return res.json({
          'message':"invitee tidak ditemukan",
        })
      }
      var acaraUserEmail = data.val().userEmail
      var tokenUserEmail = req.decodedToken.email
      if(acaraUserEmail == tokenUserEmail){
        var invitee = {}
        invitee.namaLengkap = req.body.namaLengkap
        invitee.email = req.body.email
        inviteeRef.update({
          "namaLengkap": invitee.namaLengkap,
          "email": invitee.email
        })
        .then(()=>{
          return res.json({
            'message':"invitee berhasil diedit",
          })
        })
        .catch(function(error) {
          console.log('Error editing data:', error);
          return res.json({
            'message': "error edit invitee",
          })
        })
      }
      else{
        return res.json({
          'message':"user tidak memiliki hak menambahkan invitees untuk acara yang dibuat user lain",
        })
      }
    })
  });
})

app.post('/acara/:idAcara/invitees/:idInvitee/hapus', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var inviteeRef = db.ref("/acara/"+req.params.idAcara+"/invitees/"+req.params.idInvitee);
    inviteeRef.once("value",function(dataInvitee){
      if(dataInvitee.val() == null){
        return res.json({
          'message':"invitee tidak ditemukan",
        })
      }
      var acaraUserEmail = data.val().userEmail
      var tokenUserEmail = req.decodedToken.email
      if(acaraUserEmail == tokenUserEmail){
        inviteeRef.remove()
        .then(()=>{
	        return res.json({
    	      'message':"invitee berhasil dihapus",
          })  
        })
        .catch(function(error) {
          console.log('Error deleting data:', error);
            return res.json({
              'message': "error hapus invitee",
            })  
        });
      }
      else{
        return res.json({
          'message':"user tidak memiliki hak menghapus invitee untuk acara yang dibuat user lain",
        })
      }
    })
  });
})

app.post('/acara/:idAcara/invitees/kirim-undangan', verifyToken, (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(data) {
    if(data.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var acaraUserEmail = data.val().userEmail
    var tokenUserEmail = req.decodedToken.email
    if(acaraUserEmail == tokenUserEmail){
      var inviteesRef = db.ref("/acara/"+req.params.idAcara+"/invitees");
      inviteesRef.once("value", function(dataInvitees) {
        var failedMessages = []
        var successMessages = []
        for (var key in dataInvitees.val()){
          var invitee = dataInvitees.val()[key]
          var textMessage = `Undangan Pernikahan atas nama ${data.val().namaPria} dan ${data.val().namaWanita}. Informasi lebih lanjut: http://localhost:5000/acara/${req.params.idAcara}/invitees/${key}/undangan`
          
          var mailOptions = {
            from: 'kawindotcom.undangan@gmail.com',
            to: invitee.email,
            subject: 'Undangan Pernikahan',
            text: textMessage
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
              failedMessages.push(invitee)
            } else {
              successMessages.push(invitee)
              // console.log("success")
            }
          });
        }
        return res.json({
          "messages":"undangan telah dikirim"
        })
      });
    }else{
      return res.json({
        'message':"user tidak memiliki hak mengirim undangan untuk invitees dari acara lain",
      })
    }
  });  
})

app.get('/acara/:idAcara/invitees/:idInvitee/undangan', (req, res) => {
  var acaraRef = db.ref("/acara/"+req.params.idAcara);
  acaraRef.once("value", function(acaraData) {
    if(acaraData.val() == null){
      return res.json({
        'message':"acara tidak ditemukan",
      })
    }
    var inviteeRef = db.ref("/acara/"+req.params.idAcara+"/invitees/"+req.params.idInvitee);
    inviteeRef.once("value",function(inviteeData){
      if(inviteeData.val() == null){
        return res.json({
          'message':"invitee tidak ditemukan",
        })
      }
      var dataInvitee = inviteeData.val()
      var dataAcara = {}
      dataAcara.dresscode = acaraData.val().dresscode
      dataAcara.latitude = acaraData.val().latitude
      dataAcara.longitude = acaraData.val().longitude
      dataAcara.namaPria = acaraData.val().namaPria
      dataAcara.namaWanita = acaraData.val().namaWanita
      dataAcara.waktuAcara = acaraData.val().waktuAcara

      return res.json({
        dataInvitee,
        dataAcara
      })
    })  
  });
})

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname + '/login.html'));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})