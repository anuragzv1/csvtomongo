const csv = require('csvtojson'); //module to store csv file as JSON array.
const express = require('express'); //express module for api get/post endoints
const readConfig = require('jsonfile').readFileSync; //for reading app config file
const jwt = require('jsonwebtoken'); // JSON web token to provide API-AUTHENTICATION
const app = express(); //setting our app to Express.
var bodyParser = require('body-parser') //body-parser to handle json data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
const hbs = require('hbs');
app.set('view engine', 'hbs');
app.use(express.static('views/'));


//Load Config File
try {
    var config = readConfig("config.json");
} catch (e) {
    console.log("[error] " + new Date().toGMTString() + " : Server Config Not Found.");
    return process.exit(-1);
}
//PORT OF THE APP
const port = config.port || 6000 //Picks up the port from the config file. 



//database_config
var MongoClient = require('mongodb').MongoClient;
var url = config.mongo.url;



//Reading data csv file and storing MongoDB Database
csv()
    .fromFile(config.csv.csvPath)
    .then(function (cricketarray) { //when csv parse finished, result will be emitted here
        datalength = cricketarray.length;
        console.log(datalength);
        MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
            if (err) throw err;
            var dbo = db.db("HSBC_CRICKET");
            var role = '';
            for (i = 0; i < datalength; i++) {

                if (cricketarray[i].captain == '1') {
                    role = role + 'captain,';
                }
                if (cricketarray[i].wktkeeper == '1') {
                    role = role + 'wktkeeper,';
                }
                if (cricketarray[i].Is_batsman == '1') {
                    role = role + 'batsmen,';
                }
                if (cricketarray[i].Is_bowler == '1') {
                    role = role + 'bowler,';
                }
                var myquery = { _id: i };
                //Data to be inserted ini personal collection
                var myobj = { $set: { _id: i, name: cricketarray[i].Name, role: role, value: cricketarray[i].Player_Value_USD, team: cricketarray[i].Team, nationality: cricketarray[i].Nationality } }
                dbo.collection("personals").updateOne(myquery, myobj, { upsert: true }, function (err, res) {
                    if (err) throw err;
                    else if (!err) {

                    }
                });
                role = '';
                //data to be inserted in Batting stats
                var batting = {
                    $set:
                    {
                        _id: i,
                        "name": cricketarray[i].Name,
                        "matches": cricketarray[i].Matches,
                        "innings": cricketarray[i].Innings_played,
                        "strike_rate": cricketarray[i].Strike_rate,
                        "highest_score": cricketarray[i].Highest_score,
                        "batting_avg": cricketarray[i].Batting_avg,
                        "hundreds": cricketarray[i]._100_runs_made,
                        "fifty": cricketarray[i]._50_runs_made,
                        "4s": cricketarray[i]._4s,
                        "6s": cricketarray[i]._6s
                    }
                }
                dbo.collection("batsmens").updateOne(myquery, batting, { upsert: true }, function (err, res) {
                    if (err) throw err;
                });
                var batting = {
                    $set:
                    {
                        _id: i,
                        //data to be inserted in bolwing stats
                        "name": cricketarray[i].Name,
                        "bowling Economy": cricketarray[i].Bowling_econ,
                        "balls bowled": cricketarray[i].Number_of_balls_bowled,
                        "wickets Taken": cricketarray[i].Wkts_taken,
                        "5 wicket hauls": cricketarray[i]._5_Wicket_hauls

                    }
                }
                dbo.collection("bowlers").updateOne(myquery, batting, { upsert: true }, function (err, res) {
                    if (err) throw err;
                });
            }
            db.close();
        });
    })

//API FOR GETTING THE PLAYERS INFORMATION 
app.post('/get_player_info', verifyToken, (req, res) => {
    console.log(req.body.name);
    jwt.verify(req.token, config.secretkey, (err, authData) => {
        if (err) {
            res.sendStatus(403);
        }

        else if (!err) {
            var personalresult;
            var batting = [];
            var bowling = [];
            var j = 0;
            MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
                if (err) throw err;
                var dbo = db.db("HSBC_CRICKET");
                dbo.collection("personals").find({ "name": req.body.name }).toArray(function (err, personalresult) {
                    if (err) throw err;
                    // console.log(personalresult);
                    dbo.collection("batsmens").find({ "name": req.body.name }).toArray(function (err, batsmensresult) {
                        if (err) throw err;
                        // console.log(batsmensresult);
                        dbo.collection("bowlers").find({ "name": req.body.name }).toArray(function (err, bowlersresult) {
                            if (err) throw err;
                            // console.log(bowlersresult);
                            res.json({
                                "message": "This works",
                                authData,
                                "Personal Data:": personalresult,
                                "Batting Stats": batsmensresult,
                                "Bowling Stats": bowlersresult

                            });
                        });
                    });
                });
            });
        }
    });

});

//GETTING TEAM PLAYERS API
app.post('/get_team_player_list',verifyToken,(req,res)=>{
    jwt.verify(req.token, config.secretkey, (err, authData) => {
        if (err) {
            res.sendStatus(403);
        }
        else if(!err){
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("HSBC_CRICKET");
                var query = {"team":req.body.team};
                var players=[];
                dbo.collection("personals").find(query).toArray(function(err, result) {
                  if (err) throw err;
                  i=0;
                  result.forEach(element => {
                      players[i]=element.name;
                      i++;
                  });
                  res.json(players);
                  //console.log(players);
                  db.close();
                });
              });
        }

    });
});



//API TO GENERATE TOKEN
app.post('/tokengen', (req, res) => {
    user = {
        username: req.body.username,
        password: req.body.password
    }
    jwt.sign({ user }, config.secretkey, (err, token) => { //picks up username password from json input and secret from config file
        if (err) {
            res.send(err);
        }
        else res.json(token);
    })
});

//VERIFY TOKEN FUNCTION
function verifyToken(req, res, next) {
    const bearer = req.headers['authorization'];
    if (typeof (bearer) !== 'undefined') {
        const actualbearer = bearer.split(' ');
        const bearerToken = actualbearer[1];
        req.token = bearerToken;
        next();
    }
    else {
        res.sendStatus(403);
    }
}

//INDEX PAGE FRONTEND
app.get('/',(req,res)=>{
    res.render('index.hbs');
})

//Opening ports for the app
app.listen(port, () => {
    console.log(`Sever started at port ${port}`);
});
