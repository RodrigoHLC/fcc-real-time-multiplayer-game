# This is my real-time multiplyer game

This was the final certification project for freeCodeCamp's Information Security course (which is also the 10th course when taken in order) and it's another project I'm proud to showcase because I'm very happy with how it turned out. The programming language is JavaScript, and it involves working with Express.js to start a server, Helmet.js for security measures and setting HTTP headers, a considerable amount of learning to work with the Canvas API for rendering the game, and a deep-dive in Socket.io for creating the real-time client-server communication and multiplayer functionality. These two were most certainly the highlights of the project, as I hadn't worked with Canvas for a few months, and Socket.io was pretty much new to me.

Working with sockets also meant there were a lot of "moving" parts at play when it came to sending and receiving information, but while this might seem daunting at first, I actually found it rather entertaining and very satisfying once I managed to get in "the zone": that moment in which you're able to hold in your mind all the pieces to your app, you understand how they interact with each other, and you can quickly infer where to look if you run into any problems. This was a great feeling and a real confidence-builder. While I always felt I would work well in this career path, I'm now more sure than ever that I can be a great programmer.

# The game

At face-value it's a very simple game: there's one item in the board (referred to as "Collectible"), and all players race to get it. The first player to reach the collectible gets 1 point. Whenever a collectible is collected, it disappears and a new collectible is rendered at a random position in the board. While there's no end to the game, there is a rank system which indicates to each player what their position is in the leaderboard (e.g:  3/6). This rank system is updated dinamically whenever players enter/leave the game and/or gather collectibles, and displays a different rank on each player's screen (unless some players are tied).

When players enter the game, they're rendered at a random location within the board (same as the collectibles), and all players see themselves as a blue genie, and the other players as a flame monster.

Here's a rundown of what I did in this project:

# Canvas

I had previously gone over the basic concepts of this API in a small freeCodeCamp lesson which involved building a very rudimentary platformer game ( https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/learn-intermediate-oop-by-building-a-platformer-game/step-1 ), and also in Wes Boss' "Fun with HTML5 Canvas" lesson from his javascript30.com course. While this project could have been completed  by creating simple shapes using canvas and using them as each player's avatar, I wanted to go the extra mile and use sprites instead.  This was a great choice because not only does the game look much better this way, but also because I got to learn so much more: <br>
• How to render image files with Canvas, and to render different image files depending on certain conditions (e.g.: whether a player is facing left or right, or if he's moving or not)<br>
• How to render different portions of the same image file depending on certain conditions (e.g.: same conditions as before), and that this is preferable to the previous method due to an image file only being loaded once.<br>
• How to render different portions of the same image file with the purpose of creating an animation.<br>
• I figured out, by myself, how to control the framerate of said animations using loops.

(credit where credit is due: I downloaded the sprites from https://craftpix.net/freebies/free-rpg-monster-sprites-pixel-art/ and https://craftpix.net/freebies/free-fantasy-enemies-pixel-art-sprite-pack/ )

# Socket.io

This was "The Big One". Not only was socket.io very new to me, but there were a lot of pieces to this puzzle in my game: different types of information that needed to be shared back-and-forth between the server and the clients, but there were also a lot of specific situations in which said information needed to be sent and received, and this required a lot of thinking-ahead trying to cover as many bases as possible, and then some instances of going back to my code and addressing situations I hadn't been able to foresee (without introducing any breaking changes, of course). As I said previously, being able to get "in the zone" and just keep track in my mind of everything that was going on was a great feeling, and it was one of those instances in which you're working and you simply can't—put—it—down.

## A brief summary of how it works:

### Server

The server stores positional data about each collectible and emits it to all players so they can all see where it is. This information is only transmitted whenever a new collectible is created (so players can see where it is) and whenever a collectible is gathered (so it disappears from all players' screens). There's no need to constantly transmit positional data of the collectible.

The server receives and stores positional data about each player everytime they move, and this reception triggers the emission of this data to ALL players so they can all see where the other players are in real-time. Because each player is constantly moving, they're constantly sending information to the server, and the server is constantly sending this information back to ALL players. 

The server receives and stores information about the number of connected players and each players' score, which is updated everytime a player connects, disconnects, or gathers a collectible. When any of these things happen, the data is sent to all players so they can calculate and display their rank

When a player connects, the server gets his/her socket ID and sends this data as well as positional data of the collectible ONLY TO SAID PLAYER, so that he/she can render the positions of the current collectible, and set the id to the socket's id. The client now creates the player at a random point within the board, sends this positional data to the server, where it is stored. Now, positional data of ALL players is sent to ALL players so they can render each rival on their screen.

### Client/Player

Most of the information that is shared is created by each client, as they generate positional data when they connect/disconnect to/from the server, positional data for the collectible everytime they gather one and, most importantly, they're constantly generating positional data everytime they move their avatar.

Whenever a player connects or moves, their positonal data is sent to the server, where it is updated, and then the positional data of ALL players is sent to ALL players. Each client then uses said information to render all the other players in their screen (while ignoring the positional data about themselves, as they are already rendered client-side).

The same happens whenever a player connects/or disconnects but, in this case, information about the number of players and each player's score is also sent to ALL clients, so they can calculate and update their rank.

When a player connects, the server gets his/her socket ID and emits it to said player ONLY, along with positional data of the current collectible. The client now creates the player at a random point within the board, sends this positional data to the server, where it is stored. Now, positional data of ALL players is sent to ALL players so they can render each rival on their screen (this was also covered in the last paragraph of the Server summary)

### Special consideration

Even though the game tries to be real-time, due to the nature of data transmission, every client does experience some lag: their rivals' position is rendered slightly after they actually move. This means that, in some circumstances, a player can see his avatar as being closer to the collectible than a rival's avatar, while in reality the rival is closer. Furthermore, since a collectible claim event is triggered client-side, whenever a player reaches said collectible, on rare occassions, two players who reach a collectible very close in time could both be assigned a point for said collectible, when in reality only one of them should be awarded the point. This is due to the fact that, originally, the point was awarded to the player automatically when he/she gathered a collectible. In order to fix this, I re-thought and tweaked the collectible creation and scoring process.

Original process:
Collectible is created → Player/client gathers collectible → Player is awarded a point → Collectible disappears and a new collectible with a new collectible.id is created client-side (*). The server emits to every player the new leaderboard so each of them can calculate and display their rank.  →  player sends positional and id data of this new collectible to the server   →  the server emits the new collectible's data to EVERY player so that everyone can see it.

New flow (changes are marked with ◘):
Collectible is created →  ◘ collectible.id is stored as currentCollectibleId ◘  →  Player/client gathers collectible  →   ◘ Player sends a request to the server to update score (request includes the gathered collectible's id and the player's id) ◘  →  ◘ If gathered collectible's id matches currentCollectibleId, that means the player was the first player to reach the collectible ◘  →  ◘ The player is assigned a point served-side and currentCollectibleId is immediately changed to 0 (this means if another player reaches the same collectible right after the first player, when he/she sends the request, the gathered collectible's id will NOT match currentCollectibleId and a point will not be assigned) ◘  →  The server emits to every player the new leaderboard so each of them can calculate and display their rank.  ◘The server also emits a response ONLY to the client who first gathered the collectible◘, triggering creation of a new collectible client-side  (*) →  player sends positional and id data of this new collectible to the server  →  the server emits the new collectible's data to EVERY player so that everyone can see it.

(*) On hindsight, it would probably have been better to handle creation of new collectibles on the server.
