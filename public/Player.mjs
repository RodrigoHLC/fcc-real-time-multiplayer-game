/*global io*/
// let socket = io()
import {socket} from './game.mjs' // ◘ ◘ UNUSED ◘ ◘
class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id

    this.width = 25
    this.height = 50
    this.speedX = 0;
    this.speedY = 0
    this.facing = "Right"
    this.state = "idle"
  }

  movePlayer(dir, speed) {
    switch(dir){
      case "Right":
        this.facing = "Right"
        this.speedX = speed
        break
      case "Left":
        this.facing = "Left"
        this.speedX = -speed
        break
      case "Down":
        this.speedY = speed
        break
      case "Up":
        this.speedY = -speed
        break
    }
    this.state = "moving"
  }

  collision(item) {
    if( this.x <= item.x+item.width/2  && 
      this.x+this.width >= item.x+item.width/2 && 
      this.y <= item.y+item.height/2 && 
      this.y+this.height >= item.y+item.height ) {
        // REMOVE FROM SIGHT
        item.x = 0
        item.y = 0
        item.width = 0
        item.height = 0
        socket.emit("request to update score", this.id, item.id)
        return true // REQUIRED FOR fcc TESTS
      }
  }

  calculateRank(leaderboard) {
    // CREATE ARRAY WITH JUST THE SCORES IN DESCENDING ORDER
    let descendingScores = leaderboard.map( obj => Object.values(obj)).flat().sort( (a, b) => b-a )
    // FIND INDEX OF PLAYER'S SCORE TO SEE HIS/HER RANK
    let currentRanking = descendingScores.findIndex(num => num == this.score) + 1
    return `Rank: ${currentRanking}/${leaderboard.length}`
  }
}

export default Player;
