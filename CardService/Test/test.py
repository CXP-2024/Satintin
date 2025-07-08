import requests
import json
import pytest
import uuid
from typing import List, Dict, Any
import concurrent.futures
import time

BASE_URL = "http://localhost:10015"  # Assuming CardService runs on port 10015

class TestCardService:
    """Test suite for CardService APIs"""
    
    def __init__(self):
        self.valid_token = "valid-user-token-123"
        self.invalid_token = "invalid-token-999"
        self.test_card_id = "card-001"
        self.test_card_ids = ["card-001", "card-002", "card-003"]
    
    # ============= UpgradeCard API Tests =============
    
    def test_upgrade_card_valid(self):
        """Test upgrading a card with valid parameters"""
        payload = {
            "type": "UpgradeCardMessage",
            "userID": self.valid_token,
            "cardID": self.test_card_id
        }
        
        response = requests.post(f"{BASE_URL}/api/UpgradeCard", json=payload)
        
        print(f"UpgradeCard Valid - Status: {response.status_code}")
        print(f"UpgradeCard Valid - Response: {response.text}")
        
        assert response.status_code == 200
        assert "卡牌升级成功" in response.text
    
    def test_upgrade_card_invalid_token(self):
        """Test upgrading card with invalid token"""
        payload = {
            "type": "UpgradeCardMessage",
            "userID": self.invalid_token,
            "cardID": self.test_card_id
        }
        
        response = requests.post(f"{BASE_URL}/api/UpgradeCard", json=payload)
        
        print(f"UpgradeCard Invalid Token - Status: {response.status_code}")
        print(f"UpgradeCard Invalid Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "令牌无效" in response.text or "Token" in response.text
    
    def test_upgrade_card_not_owned(self):
        """Test upgrading a card not owned by user"""
        payload = {
            "type": "UpgradeCardMessage",
            "userID": self.valid_token,
            "cardID": "not-owned-card-999"
        }
        
        response = requests.post(f"{BASE_URL}/api/UpgradeCard", json=payload)
        
        print(f"UpgradeCard Not Owned - Status: {response.status_code}")
        print(f"UpgradeCard Not Owned - Response: {response.text}")
        
        assert response.status_code == 400
        assert "未拥有卡片" in response.text
    
    def test_upgrade_card_insufficient_resources(self):
        """Test upgrading card with insufficient stones"""
        payload = {
            "type": "UpgradeCardMessage",
            "userID": "low-stone-user-token",
            "cardID": self.test_card_id
        }
        
        response = requests.post(f"{BASE_URL}/api/UpgradeCard", json=payload)
        
        print(f"UpgradeCard Insufficient Resources - Status: {response.status_code}")
        print(f"UpgradeCard Insufficient Resources - Response: {response.text}")
        
        assert response.status_code == 400
        assert "资源不足" in response.text
    
    # ============= ConfigureBattleDeck API Tests =============
    
    def test_configure_battle_deck_valid(self):
        """Test configuring battle deck with valid cards"""
        payload = {
            "type": "ConfigureBattleDeckMessage",
            "userID": self.valid_token,
            "cardIDs": self.test_card_ids[:3]  # Maximum 3 cards
        }
        
        response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
        
        print(f"ConfigureBattleDeck Valid - Status: {response.status_code}")
        print(f"ConfigureBattleDeck Valid - Response: {response.text}")
        
        assert response.status_code == 200
        assert "战斗卡组设置成功" in response.text
    
    def test_configure_battle_deck_single_card(self):
        """Test configuring battle deck with single card"""
        payload = {
            "type": "ConfigureBattleDeckMessage",
            "userID": self.valid_token,
            "cardIDs": [self.test_card_id]
        }
        
        response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
        
        print(f"ConfigureBattleDeck Single - Status: {response.status_code}")
        print(f"ConfigureBattleDeck Single - Response: {response.text}")
        
        assert response.status_code == 200
        assert "战斗卡组设置成功" in response.text
    
    def test_configure_battle_deck_too_many_cards(self):
        """Test configuring battle deck with too many cards"""
        payload = {
            "type": "ConfigureBattleDeckMessage",
            "userID": self.valid_token,
            "cardIDs": ["card-001", "card-002", "card-003", "card-004"]  # More than 3
        }
        
        response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
        
        print(f"ConfigureBattleDeck Too Many - Status: {response.status_code}")
        print(f"ConfigureBattleDeck Too Many - Response: {response.text}")
        
        assert response.status_code == 400
        assert "卡牌ID数量必须是1到3张" in response.text
    
    def test_configure_battle_deck_empty_cards(self):
        """Test configuring battle deck with empty card list"""
        payload = {
            "type": "ConfigureBattleDeckMessage",
            "userID": self.valid_token,
            "cardIDs": []
        }
        
        response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
        
        print(f"ConfigureBattleDeck Empty - Status: {response.status_code}")
        print(f"ConfigureBattleDeck Empty - Response: {response.text}")
        
        assert response.status_code == 400
        assert "卡牌ID数量必须是1到3张" in response.text
    
    def test_configure_battle_deck_not_owned_cards(self):
        """Test configuring battle deck with cards not owned by user"""
        payload = {
            "type": "ConfigureBattleDeckMessage",
            "userID": self.valid_token,
            "cardIDs": ["not-owned-card-1", "not-owned-card-2"]
        }
        
        response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
        
        print(f"ConfigureBattleDeck Not Owned - Status: {response.status_code}")
        print(f"ConfigureBattleDeck Not Owned - Response: {response.text}")
        
        assert response.status_code == 400
        assert "不属于用户" in response.text
    
    # ============= DrawCard API Tests =============
    
    def test_draw_card_single(self):
        """Test drawing a single card"""
        payload = {
            "type": "DrawCardMessage",
            "userID": self.valid_token,
            "drawCount": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
        
        print(f"DrawCard Single - Status: {response.status_code}")
        print(f"DrawCard Single - Response: {response.text}")
        
        assert response.status_code == 200
        response_data = response.json()
        assert "cardList" in response_data
        assert len(response_data["cardList"]) == 1
    
    def test_draw_card_multiple(self):
        """Test drawing multiple cards"""
        payload = {
            "type": "DrawCardMessage",
            "userID": self.valid_token,
            "drawCount": 5
        }
        
        response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
        
        print(f"DrawCard Multiple - Status: {response.status_code}")
        print(f"DrawCard Multiple - Response: {response.text}")
        
        assert response.status_code == 200
        response_data = response.json()
        assert "cardList" in response_data
        assert len(response_data["cardList"]) == 5
    
    def test_draw_card_ten_pull(self):
        """Test ten-card draw (common gacha mechanic)"""
        payload = {
            "type": "DrawCardMessage",
            "userID": self.valid_token,
            "drawCount": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
        
        print(f"DrawCard Ten Pull - Status: {response.status_code}")
        print(f"DrawCard Ten Pull - Response: {response.text}")
        
        assert response.status_code == 200
        response_data = response.json()
        assert "cardList" in response_data
        assert len(response_data["cardList"]) == 10
    
    def test_draw_card_insufficient_stones(self):
        """Test drawing cards with insufficient stones"""
        payload = {
            "type": "DrawCardMessage",
            "userID": "low-stone-user-token",
            "drawCount": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
        
        print(f"DrawCard Insufficient Stones - Status: {response.status_code}")
        print(f"DrawCard Insufficient Stones - Response: {response.text}")
        
        assert response.status_code == 400
        assert "原石数量不足" in response.text
    
    def test_draw_card_invalid_count(self):
        """Test drawing cards with invalid count"""
        invalid_counts = [0, -1, 100]  # 0, negative, or too large
        
        for count in invalid_counts:
            payload = {
                "type": "DrawCardMessage",
                "userID": self.valid_token,
                "drawCount": count
            }
            
            response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
            
            print(f"DrawCard Invalid Count {count} - Status: {response.status_code}")
            print(f"DrawCard Invalid Count {count} - Response: {response.text}")
            
            assert response.status_code == 400
    
    def test_draw_card_invalid_token(self):
        """Test drawing cards with invalid token"""
        payload = {
            "type": "DrawCardMessage",
            "userID": self.invalid_token,
            "drawCount": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
        
        print(f"DrawCard Invalid Token - Status: {response.status_code}")
        print(f"DrawCard Invalid Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "Token非法" in response.text
    
    # ============= GetPlayerCards API Tests =============
    
    def test_get_player_cards_valid(self):
        """Test getting player cards with valid token"""
        payload = {
            "type": "GetPlayerCardsMessage",
            "userID": self.valid_token
        }
        
        response = requests.post(f"{BASE_URL}/api/GetPlayerCards", json=payload)
        
        print(f"GetPlayerCards Valid - Status: {response.status_code}")
        print(f"GetPlayerCards Valid - Response: {response.text}")
        
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, list)
        
        # Check card structure if cards exist
        if response_data:
            card = response_data[0]
            assert "cardID" in card
            assert "cardLevel" in card
            assert "cardName" in card or "name" in card
    
    def test_get_player_cards_invalid_token(self):
        """Test getting player cards with invalid token"""
        payload = {
            "type": "GetPlayerCardsMessage",
            "userID": self.invalid_token
        }
        
        response = requests.post(f"{BASE_URL}/api/GetPlayerCards", json=payload)
        
        print(f"GetPlayerCards Invalid Token - Status: {response.status_code}")
        print(f"GetPlayerCards Invalid Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "Token无效" in response.text
    
    def test_get_player_cards_empty_token(self):
        """Test getting player cards with empty token"""
        payload = {
            "type": "GetPlayerCardsMessage",
            "userID": ""
        }
        
        response = requests.post(f"{BASE_URL}/api/GetPlayerCards", json=payload)
        
        print(f"GetPlayerCards Empty Token - Status: {response.status_code}")
        print(f"GetPlayerCards Empty Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "Token无效" in response.text
    
    def test_get_player_cards_short_token(self):
        """Test getting player cards with too short token"""
        payload = {
            "type": "GetPlayerCardsMessage",
            "userID": "short"  # Less than 10 characters
        }
        
        response = requests.post(f"{BASE_URL}/api/GetPlayerCards", json=payload)
        
        print(f"GetPlayerCards Short Token - Status: {response.status_code}")
        print(f"GetPlayerCards Short Token - Response: {response.text}")
        
        assert response.status_code == 400
        assert "Token无效" in response.text

class TestCardServiceIntegration:
    """Integration tests for CardService workflows"""
    
    def test_card_lifecycle_workflow(self):
        """Test complete card lifecycle: draw -> get cards -> configure deck -> upgrade"""
        token = "integration-test-token-123"
        
        # Step 1: Draw cards
        draw_payload = {
            "type": "DrawCardMessage",
            "userID": token,
            "drawCount": 3
        }
        
        draw_response = requests.post(f"{BASE_URL}/api/DrawCard", json=draw_payload)
        print(f"Integration - Draw Cards: {draw_response.status_code}")
        
        if draw_response.status_code == 200:
            drawn_cards = draw_response.json()["cardList"]
            
            # Step 2: Get player cards
            get_payload = {
                "type": "GetPlayerCardsMessage",
                "userID": token
            }
            
            get_response = requests.post(f"{BASE_URL}/api/GetPlayerCards", json=get_payload)
            print(f"Integration - Get Cards: {get_response.status_code}")
            
            if get_response.status_code == 200:
                player_cards = get_response.json()
                
                # Step 3: Configure battle deck with drawn cards
                if len(player_cards) >= 1:
                    deck_payload = {
                        "type": "ConfigureBattleDeckMessage",
                        "userID": token,
                        "cardIDs": [card["cardID"] for card in player_cards[:3]]
                    }
                    
                    deck_response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=deck_payload)
                    print(f"Integration - Configure Deck: {deck_response.status_code}")
                    
                    # Step 4: Upgrade a card
                    if player_cards:
                        upgrade_payload = {
                            "type": "UpgradeCardMessage",
                            "userID": token,
                            "cardID": player_cards[0]["cardID"]
                        }
                        
                        upgrade_response = requests.post(f"{BASE_URL}/api/UpgradeCard", json=upgrade_payload)
                        print(f"Integration - Upgrade Card: {upgrade_response.status_code}")
    
    def test_concurrent_card_operations(self):
        """Test concurrent card operations"""
        import concurrent.futures
        
        def perform_operation(operation_type, user_id):
            token = f"concurrent-user-{user_id}"
            
            if operation_type == "draw":
                payload = {
                    "type": "DrawCardMessage",
                    "userID": token,
                    "drawCount": 1
                }
                endpoint = "/api/DrawCard"
            elif operation_type == "get":
                payload = {
                    "type": "GetPlayerCardsMessage",
                    "userID": token
                }
                endpoint = "/api/GetPlayerCards"
            
            response = requests.post(f"{BASE_URL}{endpoint}", json=payload)
            return {
                "user_id": user_id,
                "operation": operation_type,
                "status": response.status_code,
                "success": response.status_code == 200
            }
        
        # Perform concurrent operations
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            
            # Submit concurrent draw operations
            for i in range(5):
                futures.append(executor.submit(perform_operation, "draw", i))
            
            # Submit concurrent get operations
            for i in range(5):
                futures.append(executor.submit(perform_operation, "get", i))
            
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # Analyze results
        success_count = sum(1 for r in results if r["success"])
        print(f"Concurrent Operations: {success_count}/{len(results)} succeeded")
        
        for result in results:
            print(f"User {result['user_id']} {result['operation']}: {result['status']}")

class TestCardServiceLoadTesting:
    """Load testing for CardService"""
    
    def test_rapid_card_draws(self):
        """Test rapid successive card draws"""
        token = "load-test-user-token"
        
        for i in range(10):
            payload = {
                "type": "DrawCardMessage",
                "userID": token,
                "drawCount": 1
            }
            
            start_time = time.time()
            response = requests.post(f"{BASE_URL}/api/DrawCard", json=payload)
            end_time = time.time()
            
            print(f"Draw {i+1}: {response.status_code} - {(end_time - start_time)*1000:.2f}ms")
            
            if response.status_code != 200:
                print(f"Draw {i+1} failed: {response.text}")
    
    def test_massive_deck_configurations(self):
        """Test many deck configuration changes"""
        token = "deck-config-test-token"
        
        deck_configurations = [
            ["card-001"],
            ["card-001", "card-002"],
            ["card-001", "card-002", "card-003"],
            ["card-002", "card-003"],
            ["card-003"]
        ]
        
        for i, deck in enumerate(deck_configurations):
            payload = {
                "type": "ConfigureBattleDeckMessage",
                "userID": token,
                "cardIDs": deck
            }
            
            response = requests.post(f"{BASE_URL}/api/ConfigureBattleDeck", json=payload)
            print(f"Deck Config {i+1}: {response.status_code} - {len(deck)} cards")

if __name__ == "__main__":
    print("Testing CardService APIs...\n")
    
    # Basic functionality tests
    test_service = TestCardService()
    
    print("=== UpgradeCard API Tests ===")
    try:
        test_service.test_upgrade_card_valid()
        print("✓ UpgradeCard valid test passed\n")
    except Exception as e:
        print(f"✗ UpgradeCard valid test failed: {e}\n")
    
    try:
        test_service.test_upgrade_card_invalid_token()
        print("✓ UpgradeCard invalid token test passed\n")
    except Exception as e:
        print(f"✗ UpgradeCard invalid token test failed: {e}\n")
    
    print("=== ConfigureBattleDeck API Tests ===")
    try:
        test_service.test_configure_battle_deck_valid()
        print("✓ ConfigureBattleDeck valid test passed\n")
    except Exception as e:
        print(f"✗ ConfigureBattleDeck valid test failed: {e}\n")
    
    try:
        test_service.test_configure_battle_deck_too_many_cards()
        print("✓ ConfigureBattleDeck too many cards test passed\n")
    except Exception as e:
        print(f"✗ ConfigureBattleDeck too many cards test failed: {e}\n")
    
    print("=== DrawCard API Tests ===")
    try:
        test_service.test_draw_card_single()
        print("✓ DrawCard single test passed\n")
    except Exception as e:
        print(f"✗ DrawCard single test failed: {e}\n")
    
    try:
        test_service.test_draw_card_multiple()
        print("✓ DrawCard multiple test passed\n")
    except Exception as e:
        print(f"✗ DrawCard multiple test failed: {e}\n")
    
    print("=== GetPlayerCards API Tests ===")
    try:
        test_service.test_get_player_cards_valid()
        print("✓ GetPlayerCards valid test passed\n")
    except Exception as e:
        print(f"✗ GetPlayerCards valid test failed: {e}\n")
    
    try:
        test_service.test_get_player_cards_invalid_token()
        print("✓ GetPlayerCards invalid token test passed\n")
    except Exception as e:
        print(f"✗ GetPlayerCards invalid token test failed: {e}\n")
    
    print("=== Integration Tests ===")
    integration_test = TestCardServiceIntegration()
    try:
        integration_test.test_card_lifecycle_workflow()
        print("✓ Card lifecycle integration test completed\n")
    except Exception as e:
        print(f"✗ Card lifecycle integration test failed: {e}\n")
    
    try:
        integration_test.test_concurrent_card_operations()
        print("✓ Concurrent operations test completed\n")
    except Exception as e:
        print(f"✗ Concurrent operations test failed: {e}\n")
    
    print("=== Load Tests ===")
    load_test = TestCardServiceLoadTesting()
    try:
        load_test.test_rapid_card_draws()
        print("✓ Rapid card draws test completed\n")
    except Exception as e:
        print(f"✗ Rapid card draws test failed: {e}\n")
    
    try:
        load_test.test_massive_deck_configurations()
        print("✓ Massive deck configurations test completed\n")
    except Exception as e:
        print(f"✗ Massive deck configurations test failed: {e}\n")