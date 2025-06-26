import requests
import json
import pytest
from typing import Optional

BASE_URL = "http://localhost:10014"  # Assuming BattleService runs on port 10014

class TestBattleService:
    
    def test_submit_player_action_pancake_valid(self):
        """Test submitting a valid Pancake action"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "valid-user-token-123",
            "roomID": "room-001", 
            "actionType": "Pancake",
            "targetID": "target-player-456"
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Pancake Action - Status: {response.status_code}")
        print(f"Pancake Action - Response: {response.text}")
        
        assert response.status_code == 200
        assert "成功" in response.text or "success" in response.text.lower()
    
    def test_submit_player_action_defense_valid(self):
        """Test submitting a valid Defense action"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "valid-user-token-123",
            "roomID": "room-001",
            "actionType": "Defense",
            "targetID": None  # Defense might not need a target
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Defense Action - Status: {response.status_code}")
        print(f"Defense Action - Response: {response.text}")
        
        assert response.status_code == 200
        assert "成功" in response.text or "success" in response.text.lower()
    
    def test_submit_player_action_spray_valid(self):
        """Test submitting a valid Spray action"""
        payload = {
            "type": "SubmitPlayerActionMessage", 
            "userToken": "valid-user-token-123",
            "roomID": "room-001",
            "actionType": "Spray",
            "targetID": "target-player-789"
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Spray Action - Status: {response.status_code}")
        print(f"Spray Action - Response: {response.text}")
        
        assert response.status_code == 200
        assert "成功" in response.text or "success" in response.text.lower()
    
    def test_submit_player_action_invalid_token(self):
        """Test with invalid user token"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "invalid-token-999",
            "roomID": "room-001",
            "actionType": "Pancake",
            "targetID": "target-player-456"
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Invalid Token - Status: {response.status_code}")
        print(f"Invalid Token - Response: {response.text}")
        
        assert response.status_code == 400 or response.status_code == 403
        assert "Token无效" in response.text or "认证" in response.text
    
    def test_submit_player_action_empty_token(self):
        """Test with empty user token"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "",
            "roomID": "room-001", 
            "actionType": "Defense",
            "targetID": None
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Empty Token - Status: {response.status_code}")
        print(f"Empty Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "Token" in response.text
    
    def test_submit_player_action_invalid_action_type(self):
        """Test with invalid action type"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "valid-user-token-123",
            "roomID": "room-001",
            "actionType": "InvalidAction",  # Not in ["Pancake", "Defense", "Spray"]
            "targetID": "target-player-456"
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Invalid Action - Status: {response.status_code}")
        print(f"Invalid Action - Response: {response.text}")
        
        assert response.status_code == 400
        assert "无效的操作类型" in response.text or "invalid" in response.text.lower()
    
    def test_submit_player_action_empty_room_id(self):
        """Test with empty room ID"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "valid-user-token-123", 
            "roomID": "",  # Empty room ID
            "actionType": "Pancake",
            "targetID": "target-player-456"
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Empty Room ID - Status: {response.status_code}")
        print(f"Empty Room ID - Response: {response.text}")
        
        assert response.status_code == 400
    
    def test_submit_player_action_missing_fields(self):
        """Test with missing required fields"""
        payload = {
            "type": "SubmitPlayerActionMessage",
            "userToken": "valid-user-token-123"
            # Missing roomID and actionType
        }
        
        response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
        
        print(f"Missing Fields - Status: {response.status_code}")
        print(f"Missing Fields - Response: {response.text}")
        
        assert response.status_code == 400
    
    def test_submit_player_action_case_sensitive_action_type(self):
        """Test action type case sensitivity"""
        test_cases = [
            "pancake",  # lowercase
            "PANCAKE",  # uppercase  
            "Pancake",  # correct case
            "defense",  # lowercase
            "DEFENSE",  # uppercase
            "Defense"   # correct case
        ]
        
        for action_type in test_cases:
            payload = {
                "type": "SubmitPlayerActionMessage",
                "userToken": "valid-user-token-123",
                "roomID": "room-001",
                "actionType": action_type,
                "targetID": "target-player-456"
            }
            
            response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
            
            print(f"ActionType '{action_type}' - Status: {response.status_code}")
            print(f"ActionType '{action_type}' - Response: {response.text}")
            
            # Only exact case should work based on your code
            if action_type in ["Pancake", "Defense", "Spray"]:
                expected_status = 200
            else:
                expected_status = 400

class TestBattleServiceIntegration:
    """Integration tests for multiple player actions"""
    
    def test_multiple_players_same_room(self):
        """Test multiple players submitting actions in the same room"""
        players = [
            {"token": "player1-token", "target": "player2"},
            {"token": "player2-token", "target": "player3"}, 
            {"token": "player3-token", "target": "player1"}
        ]
        
        room_id = "battle-room-001"
        
        for i, player in enumerate(players):
            payload = {
                "type": "SubmitPlayerActionMessage",
                "userToken": player["token"],
                "roomID": room_id,
                "actionType": "Pancake",
                "targetID": player["target"]
            }
            
            response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
            print(f"Player {i+1} action - Status: {response.status_code}")
            print(f"Player {i+1} action - Response: {response.text}")
    
    def test_rapid_actions_same_player(self):
        """Test rapid successive actions from the same player"""
        base_payload = {
            "type": "SubmitPlayerActionMessage", 
            "userToken": "rapid-player-token",
            "roomID": "rapid-room-001"
        }
        
        actions = [
            {"actionType": "Defense", "targetID": None},
            {"actionType": "Pancake", "targetID": "enemy1"},
            {"actionType": "Spray", "targetID": "enemy2"}
        ]
        
        for action in actions:
            payload = {**base_payload, **action}
            response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
            print(f"Rapid action {action['actionType']} - Status: {response.status_code}")

class TestBattleServiceLoadTesting:
    """Load testing for battle service"""
    
    def test_concurrent_actions(self):
        """Test concurrent player actions"""
        import concurrent.futures
        import threading
        
        def submit_action(player_id):
            payload = {
                "type": "SubmitPlayerActionMessage",
                "userToken": f"load-test-player-{player_id}",
                "roomID": "load-test-room",
                "actionType": "Pancake", 
                "targetID": f"target-{player_id % 5}"  # 5 different targets
            }
            
            response = requests.post(f"{BASE_URL}/api/SubmitPlayerAction", json=payload)
            return {
                "player_id": player_id,
                "status": response.status_code,
                "response": response.text
            }
        
        # Submit 10 concurrent actions
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(submit_action, i) for i in range(10)]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        for result in results:
            print(f"Concurrent test Player {result['player_id']}: {result['status']}")
        
        # Check that most succeeded
        success_count = sum(1 for r in results if r['status'] == 200)
        assert success_count >= 7  # At least 70% success rate

if __name__ == "__main__":
    print("Testing BattleService SubmitPlayerAction API...\n")
    
    test_service = TestBattleService()
    
    print("=== Basic Action Tests ===")
    try:
        test_service.test_submit_player_action_pancake_valid()
        print("✓ Pancake action test passed\n")
    except Exception as e:
        print(f"✗ Pancake action test failed: {e}\n")
    
    try:
        test_service.test_submit_player_action_defense_valid()
        print("✓ Defense action test passed\n")
    except Exception as e:
        print(f"✗ Defense action test failed: {e}\n")
    
    try:
        test_service.test_submit_player_action_spray_valid()
        print("✓ Spray action test passed\n")
    except Exception as e:
        print(f"✗ Spray action test failed: {e}\n")
    
    print("=== Error Handling Tests ===")
    try:
        test_service.test_submit_player_action_invalid_token()
        print("✓ Invalid token test passed\n")
    except Exception as e:
        print(f"✗ Invalid token test failed: {e}\n")
    
    try:
        test_service.test_submit_player_action_invalid_action_type()
        print("✓ Invalid action type test passed\n")
    except Exception as e:
        print(f"✗ Invalid action type test failed: {e}\n")
    
    try:
        test_service.test_submit_player_action_case_sensitive_action_type()
        print("✓ Case sensitivity test completed\n")
    except Exception as e:
        print(f"✗ Case sensitivity test failed: {e}\n")
    
    print("=== Integration Tests ===")
    integration_test = TestBattleServiceIntegration()
    try:
        integration_test.test_multiple_players_same_room()
        print("✓ Multiple players test completed\n")
    except Exception as e:
        print(f"✗ Multiple players test failed: {e}\n")
    
    print("=== Load Tests ===")
    load_test = TestBattleServiceLoadTesting()
    try:
        load_test.test_concurrent_actions()
        print("✓ Concurrent actions test completed\n")
    except Exception as e:
        print(f"✗ Concurrent actions test failed: {e}\n")