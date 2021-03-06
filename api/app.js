// Nizam Alesevic

// libraries
const express = require('express');
const mongojs = require('mongojs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 4000;
const app = express();

// if app is running locally
let config;
if (port == 4000) {
    config = require('./config.js');
}
const db = mongojs(process.env.MONGODB_URL || config.MONGODB_URL);


app.use(bodyParser.json());

// Global Middlewear
app.use((req, res, next) => {
    console.log('Server time ' + Date.now());
    next();
});

//enables cors
const cors = require('cors');
app.use(cors());

//for cross-origin request block
// app.use(function(req, res, next) {
//     console.log("Setting up headers")
//     res.header('Access-Control-Allow-origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
//   });

// Express Routers
let admin_router = express.Router();
require('./routes/admin.js')(admin_router, db, mongojs, config, jwt);
app.use('/admin', admin_router);

let company_router = express.Router();
require('./routes/company.js')(company_router, db, mongojs, config, jwt);
app.use('/company', company_router);

let passenger_router = express.Router();
require('./routes/passenger.js')(passenger_router, db, mongojs, config, jwt);
app.use('/passenger', passenger_router);

let public_router = express.Router();
require('./routes/public.js')(public_router, db, mongojs, config, jwt);
app.use('/', public_router);

app.get('/drivers', (req, res) => {
    db.driver.find({}, (error, docs) => res.json(docs));
})

// Google Authentication
const { google } = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID || config.CLIENT_ID,
    process.env.CLIENT_SECRET || config.CLIENT_SECRET,
    process.env.REDIRECT_URL || config.REDIRECT_URL
);

// app.get('/login', (req, res) => {
//     let code = req.query.code;
//     /* If redirected from Google API */
//     if (code) {
//       oauth2Client.getToken(code).then((result) => {
//           oauth2Client.setCredentials({access_token: result.tokens.access_token});
//           let oauth2 = google.oauth2({
//               auth: oauth2Client,
//               version: 'v2'
//           });
          
//           oauth2.userinfo.get((err, response) => {
//               if (err) {
//                   throw err;
//               }
//               let data = response.data;

//               db.user.findAndModify({ 
//                   query: { email: data.email },
//                   update: { $setOnInsert: { email: data.email, name: data.name, signup_time: new Date(), type: 'company' } },
//                   new: true,
//                   upsert: true  
//               }, (error, doc) => {
//                   if (error) {
//                       console.log(error);
//                   }
//                   let jwtToken = jwt.sign({
//                       ...data,
//                       exp: (Math.floor(Date.now() / 1000) + 3600), // token which lasts for an hour
//                       id: doc._id,
//                       type: doc.type
//                   }, process.env.JWT_SECRET || config.JWT_SECRET);
//                   /* Output the JWT */
//                   res.json({ 'jwt' : jwtToken });
//               });
//           });
//       });
//     /* If coming to the login URL for the first time */
//     } else {
//       const scopes = [
//           'https://www.googleapis.com/auth/userinfo.profile',
//           'https://www.googleapis.com/auth/userinfo.email'
//       ];
      
//       const url = oauth2Client.generateAuthUrl({
//           access_type: 'online',
//           scope: scopes
//       });
//       res.redirect(url);
//     }
// });

app.post('/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    db.user.findOne({ email: email, password: password }, (error, doc) => {
        if(error) 
            throw error;
        if(doc == null) {
            res.status(400).send();
        } else {
            let jwtToken = jwt.sign({
                id: doc._id,
                userType: doc.type,
                exp: (Math.floor(Date.now() / 1000) + 3600) // token which lasts for an hour
            }, process.env.JWT_SECRET || config.JWT_SECRET);
            res.setHeader("Authorization", jwtToken);
            let data = [];
            let userType = doc.type;
            data.push(jwtToken);
            data.push(userType)
            res.status(200).send(data);
        }
    })
})

// static routes
if(port == 4000)
    app.use('/', express.static('./../frontend/public'));
else
    app.use('/', express.static('./../frontend/build'));

app.get('/*',function (req,res) {
    res.sendFile(path.join(__dirname,'./../frontend/build/index.html'), function(err) {
        if (err) {
            res.status(500).send(err)
        }
        })
})

app.listen(port, () => console.log("Listening on port " + port));