import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

/*global io*/
let socket = io(); // Note:io() works only when connecting to a socket hosted on the same url/server.
// let socket = io.connect(" ") // For connecting to an external socket hosted elsewhere, you would use io.connect('URL');.
// let socket = io("http://localhost:3000"); // Note:io() works only when connecting to a socket hosted on the same url/server.
// let socket = io("http://192.168.1.6:3000"); // Note:io() works only when connecting to a socket hosted on the same url/server.

// --- GET HTML ELEMENTS --- 
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d')
const playerCount = document.getElementById("player-count")
const rank = document.getElementById("rank")

export {socket, canvas}

// --- RANDOMIZER FUNCTIONS --- 
const randomXPos = () => { return Math.floor(Math.random()*((canvas.width-40)-20+1))+20}
function randomYPos() { return Math.floor(Math.random()*((canvas.height-40)-20+1))+20 }

// --- SOME VARIABLES FOR USING IN CANVAS ---
ctx.lineWidth = 20 // FRAME
ctx.strokeRect(0, 0, 640, 480) // FRAME
const playerAvatar = new Image();
const rivalAvatar = new Image()
const collectibleAvatar = new Image();
// playerAvatar.onload = () => {
//     ctx.drawImage(playerAvatar, 1, 1, 25, 50) // 39x78px
// }

// --- CREATE VARIABLES --- 
let player;
let collectible = {};
let currentPlayers;
let latestCollectibleId;

// • • • • • SOCKET FUNCTIONALITY • • • • • 

// --- UPON CONNECTION TO SERVER, RECEIVE DATA FROM SERVER --- 
socket.on("new player", (socketId, collectibleCounter, collectibleX, collectibleY, latestCollectibleId)=>{
  console.log(`game.mjs - User # ${socket.id} joined the game`);
  if(collectibleCounter == 0){ // IF THIS SOCKET STARTS THE GAME, CREATE FIRST COLLECTIBLE WITH NEW COORDS
    collectible = new Collectible({ x: randomXPos(), y: randomYPos(), id: Date.now() });
    socket.emit("new collectible", { // SEND NEW COORDS TO SERVER - SERVER WILL TRANSMIT TO EVERYONE
      x: collectible.x,
      y: collectible.y,
      id: collectible.id
    })
  } else { // IF GAME ALREADY STARTED, INSTANTIATE COLLECTIBLE WITH COORDS OF CURRENT COLLECTIBLE
    collectible = new Collectible({ x: collectibleX, y: collectibleY, id: latestCollectibleId });
    latestCollectibleId = collectible.id
    collectible.num = 4 // PREVENT ANIMATION
  }
  
  // --- CREATE PLAYER ---
  player = new Player( {x: randomXPos(), y: randomYPos(), score: 0, id: socketId} );
  socket.emit("player data", player.x, player.y, player.width, player.height, player.facing, player.state, player.id)
})

// --- GET LIST AND COORDS OF EXISTING PLAYERS ---
socket.on("current players", (playerList, leaderboard)=>{
  currentPlayers = playerList // DATA FOR DRAWING RIVALS
  console.log("'current players' leaderboard: ", leaderboard)

  rank.innerText = player.calculateRank(leaderboard)
})
// --- GET UPDATED PLAYER COUNT ON NEW RIVAL ---
socket.on("new rival", (onlinePlayers, leaderboard, descendingScores)=>{
  playerCount.innerText = onlinePlayers
  rank.innerText = player.calculateRank(leaderboard)
})
// --- GET UPDATED PLAYER COUNT ON RIVAL EXIT ---
socket.on("player out", ( data )=>{
  playerCount.innerText = data.onlinePlayers
  currentPlayers = data.playerList

  rank.innerText = player.calculateRank(data.leaderboard)
  console.log(`game.mjs User #${socket.id} left the game`);
})

// --- GET NEW COLLECTIBLE'S COORDINATES ---
socket.on("new collectible", ( data )=>{
  collectible.x = data.x;
  collectible.y = data.y
  collectible.id = data.id
  collectible.num = 0 // FOR RESTARTING ANIMATION
  collectible.frame = 1 // FOR RESTARTING ANIMATION
  collectible.width = 20 // MAKE COLLECTIBLE VISIBLE AGAIN
  collectible.height = 20 // MAKE COLLECTIBLE VISIBLE AGAIN
})

// --- GET MOVING RIVALS' COORDINATES ---
socket.on("rival moves", (playerList) => {
  currentPlayers = playerList // DATA FOR DRAWING RIVALS
}) 

// --- UPDATE SCORE ---
socket.on("request accepted", ()=>{
  collectible.newCollectible() // WILL SEND NEW COLLECTIBLE'S DATA TO SERVER
}) 

// --- GET SCOREBOARD FOR CALCULATING RANKING---
socket.on("score array", ( leaderboard)=>{
  // let index = leaderboard.findIndex( user => player.id in user) // FIND user OBJECT THAT HAS player.id AS A PROPERTY
  // player.score = leaderboard[index][player.id]
  player.score = leaderboard.find( user => player.id in user)[player.id] // FIND user OBJECT THAT HAS player.id AS A PROPERTY [AND GET SAID OBJECT'S ITS VALUE]
  document.getElementById("score").innerText = player.score

  rank.innerText = player.calculateRank(leaderboard)
}) 
// • • • • • END OF SOCKET FUNCTIONALITY • • • • • 



const animate = () => {
    // --- DELETE PREVIOUS FRAME ---
    ctx.clearRect(10, 10, canvas.width-20, canvas.height-20) // DELETES *INSIDE* THE FRAME
    requestAnimationFrame(animate);
    
    // ↓ ↓ ↓ ANIMATING COLLECTIBLE WITH A SINGLE SPRITE SHEET ↓ ↓ ↓
    collectibleAvatar.src=`/public/sprites/collectible/ItemSpriteSheet.png`
    if(collectible.frame<20){collectible.frame++} // FOR FRAMERATE
    // if(frame>=20){frame=0} // THIS WOULD BE USEFUL FOR ANIMATION LOOPS
    if(collectible.frame%4==0 && collectible.num<4){collectible.num++} // CHANGING SPRITE
    // if(num>5){num=1} // THIS WOULD BE USEFUL FOR ANIMATION LOOPS
    
    // ↑ ↑ ↑ ANIMATING COLLECTIBLE WITH A SINGLE SPRITE SHEET ↑ ↑ ↑ 
    // -----------------------------------------------------------
    // ↓ ↓ ↓ ANIMATING COLLECTIBLE WITH INDIVIDUAL IMG FILES (MORE LOADING ISSUES) ↓ ↓ ↓
    // collectibleAvatar.src = `/public/sprites/collectible/Item${collectible.num}.png`
    // if(collectible.frame<20){collectible.frame++} // FOR FRAMERATE
    // if(collectible.frame%4==0 && collectible.num<4){collectible.num++} // CHANGING SPRITE
    // ctx.drawImage(collectibleAvatar, collectible.x, collectible.y, collectible.width, collectible.height)
    // ↑ ↑ ↑ ANIMATING COLLECTIBLE WITH INDIVIDUAL IMG FILES ↑ ↑ ↑

    // • • • SETTING PLAYER • • •
    let playerFrame;
    let spriteWidth;
    // --- SET SPRITE SIZES AND CHOOSE SPRITE PORTION ---
    if(player.state == "idle"){
      player.width = 25;
      spriteWidth = 39;
      if(player.facing == "Right"){ playerFrame = 0}
      else if(player.facing == "Left"){ playerFrame = 39}
    } 
    if(player.state == "moving"){
      player.width = 35;
      spriteWidth = 52
      if(player.facing == "Right"){playerFrame = 78}
      else if(player.facing == "Left"){ playerFrame = 130}
    }
    
    playerAvatar.src = `/public/sprites/player/PlayerSpriteSheet.png`
    // ctx.drawImage(playerAvatar, playerFrame, 0, spriteWidth, 78, player.x, player.y, player.width, player.height) //25,50

    // ORIGINAL IDEA WITH SEPARATE SPRITE FILES
    // if(player.state=="idle"){
    //   player.width = 25
    //   playerAvatar.src = `/public/sprites/player/Idle${player.facing}.png`
    // } else if (player.state == "moving"){
    //   player.width = 35
    //   playerAvatar.src = `/public/sprites/player/Flight${player.facing}.png`
    // }

    // --- CHANGE PLAYER'S POSITION ---
    player.x += player.speedX;
    player.y += player.speedY

    // --- SET STAGE LIMITS ---
    if(player.x <= 20){player.x = 20}
    if(player.x >= 585){player.x = 585}
    if(player.y < 20){player.y = 20}
    if(player.y >= 410){player.y = 410}

    // --- BROADCAST PLAYER'S POSITION AT EVERY FRAME ---
    socket.emit("player moves", player.x , player.y, player.facing, player.state, player.id)

    // • • • DRAW PREVIOUS/CURRENT PLAYERS USING THEIR REAL-TIME COORDS FROM currentPlayers • • •
    // for(let rival in currentPlayers){
    for(let rival of Object.values(currentPlayers)){
      if( rival.id == player.id ){ continue } // AVOID DRAWING PLAYER TWICE
      // --- SETTING RIVAL SPRITES ---
      // 1ST ORIGINAL METHOD WITH TWO SEPARATE SPRITES
      // rivalAvatar.src = `/sprites/enemies/Idle${rival.facing}.png`
      // ctx.drawImage(rivalAvatar, rival.x, rival.y, rival.width, rival.height) //25,50

      // 2ND METHOD: USING ONLY ONE SPRITE SHEET - ◘ FASTER LOADING ◘
      rivalAvatar.src = `/public/sprites/enemies/EnemySpriteSheet.png`
      let enemyFrame;
      if( rival.facing == "Right"){ enemyFrame = 0}
      if( rival.facing == "Left"){ enemyFrame = 25}
      ctx.drawImage(rivalAvatar, enemyFrame, 0, 25, 46, rival.x, rival.y, rival.width, rival.height) //25,50
    }  
    // • • • DRAW COLLECTIBLE • • •
    ctx.drawImage(collectibleAvatar, 70*collectible.num, 0, 70, 70, collectible.x, collectible.y, collectible.width, collectible.height) 
    // • • • DRAW PLAYER • • •
    ctx.drawImage(playerAvatar, playerFrame, 0, spriteWidth, 78, player.x, player.y, player.width, player.height) //25,50th, currentPlayers[rival].height)
    
    // --- ENABLE COLLISION DETECTION ---
    player.collision(collectible) // WILL TRIGGER COLLECTIBLE EVENT IF NECESSARY

}

// animate() // ◘ ◘ WHY DOES THIS CANCEL THE EVENT LISTENERS? RUN CONSTANT ANIMATION

window.addEventListener("keydown", ({key})=>{
    // socket.emit("key pressed", {msg: "pressed a key"})
    let dir;
    switch(key){
        case "d":
        case "D":
        case "ArrowRight":
          dir = "Right"
          break
        case "a":
        case "A":
        case "ArrowLeft":
          dir = "Left"
          break
        case "s":
        case "S":
        case "ArrowDown":
          dir = "Down"
          break
        case "w":
        case "W":
        case "ArrowUp":
          dir = "Up"
          break
      }
    player.movePlayer(dir, 5)
})
window.addEventListener("keyup", ({key})=>{
    switch(key){
        case "d":
        case "D":
        case "ArrowRight":
        case "a":
        case "A":
        case "ArrowLeft":
            player.speedX = 0
            if(player.speedY==0){player.state="idle"}
          break
        case "s":
        case "S":
        case "ArrowDown":
        case "w":
        case "W":
        case "ArrowUp":
            player.speedY = 0
            if(player.speedX==0){player.state="idle"}
          break
      }
    // player.state = "idle"
})
window.addEventListener("mousedown", (e)=>{
  console.log("click click")
}) // FOR TESTS

animate() // ◘ ◘ RUN CONSTANT ANIMATION
