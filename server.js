require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const expect = require('chai');

const http = require('http').createServer(app); // ◘ ◘
// const socket = require('socket.io') // -> const io = socket(http)
const io = require('socket.io')(http); // ◘ ◘

const cors = require('cors');
const helmet = require("helmet")

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');


app.use(helmet({
  xssFilter: {},
  noSniff: {},
  hidePoweredBy: {setTo: "PHP 7.4.3"}
  // ◘ ◘ ◘ ◘
  , noCache: {}, // TESTS REQUIRE NOTHING BE CACHED ON THE CLIENT'S SIDE, BUT THIS NEEDS TO BE DISABLED FOR THE SPRITES TO LOAD 
  // ◘ ◘ ◘ ◘
}))
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets')); // UNUSED 
app.use('/sprites', express.static(process.cwd() + '/sprites')); // ◘ MINE ◘

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 
// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

// • • • • • MY SOCKET.IO FUNCTIONALITY • • • • • 
let onlinePlayers = 0
let collectibleCounter = 0
let collectibleX = 0;
let collectibleY = 0;
let currentCollectibleId;
let playerList = {} // WILL HOLD POSITIONAL DATA OF EVERY PLAYER 
let leaderboard = [] // WILL HOLD ONLY SCORE DATA

io.on("connection", ( socket )=>{
  console.log(`User with id# ${socket.id} joined the game`);
  onlinePlayers++
  // --- SEND CURRENT GAME INFO JUST TO NEW PLAYER ---
  socket.emit("new player", socket.id, collectibleCounter, collectibleX, collectibleY, currentCollectibleId)

  // --- SEND UPDATED GAME INFO TO EVERYONE ---
  io.emit("new rival", onlinePlayers, leaderboard)

  // --- RECEIVE NEW PLAYER'S DATA ---
  socket.on("player data", (x, y, width, height, facing, state, id) => {
    playerList[id] = {x, y, width, height, facing, state, id} // ADD NEW PLAYER TO playerList
    leaderboard.push({[id]: 0}) // ADD NEW PLAYER TO leaderboard WITH SCORE OF 0
    // --- GIVE EVERY PLAYER THE COORDINATES OF EXISTING PLAYERS ---
    io.emit("current players", playerList, leaderboard)
  }) // EMITS UPDATED playerList AND leaderboard

// --- RECEIVE WHEN A COLLECTIBLE IS PICKED UP ---
  socket.on("request to update score", (id, collectibleId)=>{
    // --- IF COLLECTED ITEM'S ID MATCHES ID OF COLLECTIBLE CURRENTLY IN DISPUTE:
    if( collectibleId == currentCollectibleId ){
      let index = leaderboard.findIndex( player => id in player)
      leaderboard[index][id] += 1 // ADD 1 POINT TO PLAYER
      currentCollectibleId = 0 // QUICKLY REMOVE COLLECTIBLE ID FOR JUST A SECOND 
      
      socket.emit("request accepted") // ONLY PLAYER WHO GOT COLLECTIBLE SHOULD UPDATE HIS/HER SCORE
      io.emit("score array", leaderboard) // EVERYONE SHOULD UPDATE THEIR RANK
    }
    // IF collectibleId does not match currentCollectibleId, that means the player collected an already-taken collectible before his game had refreshed - REQUEST IS IGNORED
  }) // EMITS leaderboard ARRAY TO ALL PLAYERS


// --- IF NEW COLLECTIBLE WAS CREATED, RECEIVE DATA ---
  socket.on("new collectible", ( data )=>{
    collectibleX = data.x
    collectibleY = data.y
    currentCollectibleId = data.id 
    collectibleCounter++
    io.emit("new collectible", { 
      x: data.x,
      y: data.y,
      id: data.id
    })
  })// SENDS COLLECTIBLE COORDINATES TO ALL PLAYERS

  // --- RECEIVE PLAYER MOVEMENT DATA ---
  socket.on("player moves", (x, y, facing, state, id) => {
    playerList[id].x = x
    playerList[id].y = y
    playerList[id].facing = facing
    playerList[id].state = state
      // --- EMIT COORDINATES OF ALL PLAYERS ---
    io.emit("rival moves", playerList)
    // socket.broadcast.emit("rival moves", playerList) // EMIT TO ONLY OTHER PLAYERS?
  }) // EMITS UPDATED playerList COORDINATES INFO TO ALL PLAYERS

  // --- PLAYER DISCONNECT ---
  socket.on("disconnect", ()=>{
    console.log(`User with #id ${socket.id} left the game`)
    onlinePlayers--
    // REMOVE FROM PLAYER ROSTER AND LEADERBOARD!
    delete playerList[socket.id]
    let index = leaderboard.findIndex( player => socket.id in player)
    leaderboard = leaderboard.slice(0, index).concat( leaderboard.slice(index+1) )
    // leaderboard = leaderboard.filter( player => !(socket.id in player) ) // ANOTHER OPTION
    io.emit("player out", {id: socket.id, playerList, onlinePlayers, leaderboard})
  }) // EMITS socket.id AND UPDATED GAME INFO
})
// • • • • • END OF SOCKET FUNCTIONALITY • • • • • 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
// const myIp = "192.168.1.6" // ◘  MY CODE FOR TESTING MULTIPLE DEVICES ON MY WIFI NETWORK
// const myIp = "192.168.0.87" // ◘  RED DE LA IAIA
// const server = http.listen(portNum, myIp, () => {// ◘  MY CODE FOR TESTING MULTIPLE DEVICES ON MY WIFI NETWORK
const server = http.listen(portNum, () => { // ◘ ◘ THE PROBLEM WAS HERE!!! HAD TO CHANGE app.listen TO http.listen
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
