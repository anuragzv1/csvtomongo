# csvtomongo
This files takes in a csv file (as used by banks/schools) [Default file is a cricket stat file].
Uploads all the data to a mongoDB
Then we can query the database and find required data easily [by deafult we can get Players in a particular Team / Personal stats of a player , blowing/batting stats.
It also contains a frontend at localhost:5000

You can make require changes according to your own CSV File.

Get list of people in a Team
```
http://localhost:5000/get_team_player_list
```

Format of API call:
```
{
"team":"Sydney Sixers"
}
```

Get player Details :
```
http://localhost:5000/get_player_info
```
Format of get_player_info:
```
{
name:"Rohit Sharma"
}
```

To generate token (use username :anurag , password:password
```
http://localhost:5000/tokengen
```

NOTE: Before calling get_player_info && get_team_player_list use Authenication header:
 ```
 Authentication : Bearer <token_here_from_tokengen>
```

