/*global io*/
// let socket = io();
// import socket from "./game.mjs"
// import canvas from "./game.mjs"
import { socket, canvas } from "./game.mjs"

class Collectible {
  constructor({x, y, id}) {
    // constructor() {
    this.x = x
    // this.x = Math.floor(Math.random()*((canvas.width-40)-20+1))+20
    this.y = y
    // this.y = Math.floor(Math.random()*((canvas.height-40)-20+1))+20
    this.id = id
  
    this.value = 1
    this.width = 20
    this.height = 20
    this.num=0
    this.frame=1
  }
  newCollectible=()=>{ // THIS FUNCTION IS ONLY TRIGGERED AFTER THE SERVER APPROVED THE CREATION OF A NEW COLLECTIBLE
    this.x = Math.floor(Math.random()*((canvas.width-40)-20+1))+20
    this.y = Math.floor(Math.random()*((canvas.height-40)-20+1))+20
    this.id = Date.now()

    socket.emit("new collectible", {
      x: this.x,
      y: this.y,
      id: this.id
    })
  }
}
/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
