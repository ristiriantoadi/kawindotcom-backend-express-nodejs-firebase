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
// app.use()


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/acara/baru', (req, res) => {
    var db = admin.database();
    var ref = db.ref("/coba");
    var usersRef = ref.child("users");
    usersRef.set({
        alanisawesome: {
            date_of_birth: "June 23, 1912",
            full_name: req.body.name
        },
        gracehop: {
            date_of_birth: "December 9, 1906",
            full_name: "Grace Hopper"
        }
    });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})