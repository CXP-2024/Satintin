# WebSocket-based Battle System Implementation

## Overview

This document explains the implementation of a WebSocket-based battle system for the SaTT game. The system allows two players to engage in real-time battles using WebSocket communication.

## Architecture

The battle system consists of the following components:

1. **WebSocket Server**: Handles WebSocket connections and messages
2. **Battle Room Manager**: Manages battle rooms and player connections
3. **Battle Room Ticker**: Periodically updates battle rooms (e.g., countdown timer)
4. **Model Classes**: Define the data structures for WebSocket communication

### Communication Flow

```
Frontend (React) <--WebSocket--> Backend (Scala)
     |                               |
     v                               v
BattleRoom.tsx                 BattleWebSocketManager
     |                               |
     v                               v
WebSocketService.ts           PlayerActionProcess
```

## Implementation Details

### 1. Backend Changes

#### 1.1. Server.scala

Modified the server to support WebSockets by changing `.withHttpApp(app)` to `.withHttpWebSocketApp((wsBuilder: WebSocketBuilder[IO]) => CORS.policy.withAllowOriginAll(serviceWithWebSocket(wsBuilder).orNotFound).unsafeRunSync())`.

```scala
.withHttpWebSocketApp((wsBuilder: WebSocketBuilder[IO]) => 
  CORS.policy.withAllowOriginAll(serviceWithWebSocket(wsBuilder).orNotFound).unsafeRunSync())
```

#### 1.2. Routes.scala

Added WebSocket routes and handling:

```scala
def serviceWithWebSocket(wsBuilder: WebSocketBuilder[IO]): HttpRoutes[IO] = {
  val websocketRoute = HttpRoutes.of[IO] {
    // Battle WebSocket endpoint
    case GET -> Root / "battle" / roomId :? TokenQueryParamMatcher(token) =>
      // Validate token and handle connection
      // ...
  }

  // Combine existing Routes.service and WebSocket routes
  service <+> websocketRoute
}
```

Added methods for handling WebSocket messages:

- `handleWebSocketMessage`: Parses and routes WebSocket messages
- `processPlayerAction`: Processes player actions
- `setPlayerReady`: Sets a player as ready

#### 1.3. BattleWebSocketManager.scala

Created a new class to manage WebSocket connections and game state for a battle room:

```scala
class BattleWebSocketManager(roomId: String) {
  // Player connections
  private val connections = TrieMap[String, Queue[IO, WebSocketFrame]]()

  // Player actions for the current round
  private val currentActions = TrieMap[String, BattleAction]()

  // Player ready status
  private val playerReady = TrieMap[String, Boolean]()

  // Current game state
  private var gameState: Option[GameState] = None

  // Methods for managing connections, actions, and game state
  // ...
}
```

Key methods:
- `addConnection`: Adds a new WebSocket connection for a player
- `removeConnection`: Removes a WebSocket connection for a player
- `recordPlayerAction`: Records a player action for the current round
- `setPlayerReady`: Sets a player as ready
- `checkAndProcessActions`: Checks if both players have submitted actions and processes them
- `broadcastGameState`: Broadcasts game state to all connected players

#### 1.4. BattleRoomTicker.scala

Created a new class to handle periodic updates for battle rooms:

```scala
object BattleRoomTicker {
  def start: IO[Unit] = {
    // Run ticker every second
    Stream.awakeEvery[IO](1.second)
      .evalMap(_ => tickTask())
      .compile
      .drain
  }

  // Methods for updating rooms and handling timeouts
  // ...
}
```

Key methods:
- `tickTask`: Periodic task to update all active battle rooms
- `updateRoom`: Updates a single battle room
- `handleTimeUp`: Handles time up for a round

#### 1.5. Init.scala

Updated to start the BattleRoomTicker when the server initializes:

```scala
// Start the battle room ticker for periodic updates
_ <- IO.println("Starting BattleRoomTicker...")
_ <- BattleRoomTicker.start.start.void
```

#### 1.6. WebSocketModels.scala

Created model classes for WebSocket communication:

```scala
case class BattleAction(
  `type`: String,  // "cake" (饼), "defense" (防), "spray" (撒)
  playerId: String,
  timestamp: Long
)

case class GameState(
  roomId: String,
  player1: PlayerState,
  player2: PlayerState,
  currentRound: Int,
  roundPhase: String,
  remainingTime: Int,
  winner: Option[String] = None
)

// Other model classes...
```

### 2. Integration with Existing Code

The WebSocket implementation integrates with the existing battle logic in `PlayerActionProcess.scala`:

```scala
// Process actions using PlayerActionProcess
result <- PlayerActionProcess.processSimultaneousActions(
  roomId,
  player1Id, action1.`type`, None,
  player2Id, action2.`type`, None
)
```

This ensures that the battle logic remains consistent between the HTTP API and WebSocket communication.

## WebSocket Protocol

### Messages from Client to Server

1. **Player Action**:
   ```json
   {
     "type": "player_action",
     "data": {
       "type": "cake",
       "playerId": "user123",
       "timestamp": 1623456789000
     }
   }
   ```

2. **Player Ready**:
   ```json
   {
     "type": "player_ready"
   }
   ```

### Messages from Server to Client

1. **Game State**:
   ```json
   {
     "type": "game_state",
     "data": {
       "roomId": "room123",
       "player1": {
         "playerId": "user123",
         "username": "Player 1",
         "health": 6,
         "energy": 0,
         "rank": "Bronze",
         "cards": [],
         "isReady": true,
         "isConnected": true
       },
       "player2": {
         "playerId": "user456",
         "username": "Player 2",
         "health": 6,
         "energy": 0,
         "rank": "Bronze",
         "cards": [],
         "isReady": true,
         "isConnected": true
       },
       "currentRound": 1,
       "roundPhase": "waiting",
       "remainingTime": 30
     }
   }
   ```

2. **Round Result**:
   ```json
   {
     "type": "round_result",
     "data": {
       "round": 1,
       "player1Action": {
         "type": "cake",
         "playerId": "user123",
         "timestamp": 1623456789000
       },
       "player2Action": {
         "type": "spray",
         "playerId": "user456",
         "timestamp": 1623456790000
       },
       "results": {
         "player1": {"healthChange": -1, "energyChange": 1},
         "player2": {"healthChange": 0, "energyChange": -1}
       },
       "cardEffects": [
         {
           "playerId": "user123",
           "cardName": "Penetration Card",
           "effectType": "penetrate",
           "triggered": true
         }
       ]
     }
   }
   ```

3. **Game Over**:
   ```json
   {
     "type": "game_over",
     "data": {
       "winner": "user123",
       "reason": "health_zero",
       "rewards": {
         "stones": 10,
         "rankChange": 5
       }
     }
   }
   ```

4. **Player Joined**:
   ```json
   {
     "type": "player_joined",
     "data": {
       "playerId": "user456",
       "username": "Player 2"
     }
   }
   ```

5. **Player Left**:
   ```json
   {
     "type": "player_left",
     "data": {
       "playerId": "user456"
     }
   }
   ```

## Battle Flow

1. Player 1 creates a battle room (via HTTP API)
2. Player 2 joins the battle room (via HTTP API)
3. Both players connect to the WebSocket endpoint
4. Players set their ready status
5. When both players are ready, the game starts
6. Players submit actions for each round
7. The server processes actions and sends round results
8. The game continues until a player's health reaches 0
9. The server sends a game over message with the winner

## Conclusion

The WebSocket-based battle system provides real-time communication between players, enabling a more interactive and responsive battle experience. The implementation leverages the existing battle logic while adding WebSocket support for real-time updates.
