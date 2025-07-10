# WebSocket-based Battle System Frontend Implementation

## Overview

This document explains the implementation of the frontend part of the WebSocket-based battle system for the SaTT game. The system allows two players to engage in real-time battles using WebSocket communication.

## Architecture

The frontend WebSocket implementation consists of the following components:

1. **WebSocketService**: Handles WebSocket connections and messages
2. **BattleRoom Component**: Manages the battle room UI and WebSocket events
3. **ActionSelector Component**: Allows players to select and submit actions
4. **RoundResultModal Component**: Displays round results
5. **GameOverModal Component**: Displays game over results
6. **BattleStore**: Manages battle state using Zustand

### Communication Flow

```
Frontend (React)                      Backend (Scala)
     |                                    |
WebSocketService <--WebSocket--> BattleWebSocketManager
     |                                    |
BattleStore                        PlayerActionProcess
     |
UI Components
(BattleRoom, ActionSelector, etc.)
```

## Implementation Details

### 1. WebSocketService

The `WebSocketService` class handles WebSocket connections and message handling:

```typescript
export class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  // Connect to battle room
  connect(roomId: string, userToken: string): Promise<void> {
    // Initialize WebSocket connection
  }

  // Send player action
  sendAction(action: Omit<BattleAction, 'timestamp'>): void {
    // Send action to server
  }

  // Send ready status
  sendReady(): void {
    // Send ready status to server
  }

  // Event handling
  on(event: string, callback: (data: any) => void): void {
    // Register event listener
  }

  // Other methods...
}
```

### 2. BattleRoom Component

The `BattleRoom` component manages the battle room UI and WebSocket events:

```tsx
const BattleRoom: React.FC = () => {
  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      // Connect to WebSocket
      await webSocketService.connect(battleRoomId, getUserToken());

      // Setup event listeners
      setupWebSocketListeners();
    };

    initializeConnection();

    // Cleanup
    return () => {
      webSocketService.disconnect();
      resetBattle();
    };
  }, []);

  // Setup WebSocket event listeners
  const setupWebSocketListeners = () => {
    webSocketService.on('game_state', (gameState) => {
      // Update game state
    });

    webSocketService.on('round_result', (result) => {
      // Show round result
    });

    webSocketService.on('game_over', (result) => {
      // Show game over
    });

    // Other event listeners...
  };

  // Render UI
  return (
    <div className="battle-room">
      {/* Battle room UI */}
    </div>
  );
};
```

### 3. ActionSelector Component

The `ActionSelector` component allows players to select and submit actions:

```tsx
const ActionSelector: React.FC = () => {
  // Handle action selection
  const handleSelectAction = (actionType: 'cake' | 'defense' | 'spray') => {
    // Select action
  };

  // Handle action submission
  const handleSubmitAction = () => {
    // Send action to server
    webSocketService.sendAction({
      type: selectedAction,
      playerId: user.userID
    });

    // Update local state
    submitAction();
  };

  // Render UI
  return (
    <div className="action-selector">
      {/* Action selector UI */}
    </div>
  );
};
```

### 4. BattleStore

The `battleStore` manages battle state using Zustand:

```typescript
export const useBattleStore = create<BattleState>((set, get) => ({
  // State
  roomId: null,
  gameState: null,
  isConnected: false,
  // Other state...

  // Actions
  setGameState: (gameState: GameState) => {
    // Update game state
  },

  selectAction: (action: 'cake' | 'defense' | 'spray') => {
    // Select action
  },

  submitAction: () => {
    // Submit action
  },

  // Other actions...
}));
```

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
         "rank": "黑铁",
         "cards": [],
         "isReady": true,
         "isConnected": true
       },
       "player2": {
         "playerId": "user456",
         "username": "Player 2",
         "health": 6,
         "energy": 0,
         "rank": "黑铁",
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

1. Player creates or joins a battle room
2. Player connects to the WebSocket endpoint
3. Player sets ready status
4. When both players are ready, the game starts
5. Players submit actions for each round
6. The server processes actions and sends round results
7. The game continues until a player's health reaches 0
8. The server sends a game over message with the winner

## Conclusion

The frontend WebSocket implementation provides real-time communication with the backend, enabling a responsive and interactive battle experience. The implementation uses React components and Zustand for state management, with a dedicated WebSocketService for handling WebSocket communication.
