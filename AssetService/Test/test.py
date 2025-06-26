import requests
import json
import pytest

BASE_URL = "http://localhost:10012"

class TestAssetService:
    
    def test_valid_token(self):
        """Test with valid user token"""
        payload = {"userToken": "test-user-token-123"}
        response = requests.post(f"{BASE_URL}/api/asset/status", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, int)
        assert data >= 0
    
    def test_empty_token(self):
        """Test with empty token"""
        payload = {"userToken": ""}
        response = requests.post(f"{BASE_URL}/api/asset/status", json=payload)
        
        assert response.status_code == 400
        assert "用户Token不能为空" in response.text
    
    def test_invalid_token(self):
        """Test with invalid token"""
        payload = {"userToken": "invalid-token-12345"}
        response = requests.post(f"{BASE_URL}/api/asset/status", json=payload)
        
        assert response.status_code == 400
        assert "用户Token无效" in response.text
    
    def test_missing_token_field(self):
        """Test with missing token field"""
        payload = {}
        response = requests.post(f"{BASE_URL}/api/asset/status", json=payload)
        
        assert response.status_code == 400
    
    def test_null_token(self):
        """Test with null token"""
        payload = {"userToken": None}
        response = requests.post(f"{BASE_URL}/api/asset/status", json=payload)
        
        assert response.status_code == 400

if __name__ == "__main__":
    # Run individual tests
    test_service = TestAssetService()
    
    try:
        test_service.test_valid_token()
        print("✓ Valid token test passed")
    except Exception as e:
        print(f"✗ Valid token test failed: {e}")
    
    try:
        test_service.test_empty_token()
        print("✓ Empty token test passed")
    except Exception as e:
        print(f"✗ Empty token test failed: {e}")
    
    try:
        test_service.test_invalid_token()
        print("✓ Invalid token test passed")
    except Exception as e:
        print(f"✗ Invalid token test failed: {e}")