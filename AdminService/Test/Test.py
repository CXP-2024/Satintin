import requests
import json

BASE_URL = "http://localhost:10013"
ADMIN_TOKEN = "your-valid-admin-token"  # Replace with actual token

def test_view_system_stats():
    """Get system statistics"""
    payload = {
        "type": "ViewSystemStatsMessage",
        "adminToken": ADMIN_TOKEN
    }
    
    response = requests.post(f"{BASE_URL}/api/ViewSystemStats", json=payload)
    print(f"ViewSystemStats: {response.status_code}")
    print(f"Response: {response.json()}")
    return response

def test_ban_user():
    """Ban a user"""
    payload = {
        "type": "BanUserMessage",
        "adminToken": ADMIN_TOKEN,
        "userID": "test-user-123",
        "banDays": 3
    }
    
    response = requests.post(f"{BASE_URL}/api/BanUser", json=payload)
    print(f"BanUser: {response.status_code}")
    print(f"Response: {response.text}")
    return response

def test_unban_user():
    """Unban a user"""
    payload = {
        "type": "UnbanUserMessage",
        "adminToken": ADMIN_TOKEN,
        "userID": "test-user-123"
    }
    
    response = requests.post(f"{BASE_URL}/api/UnbanUser", json=payload)
    print(f"UnbanUser: {response.status_code}")
    print(f"Response: {response.text}")
    return response

def test_manage_report():
    """Manage a report"""
    payload = {
        "type": "ManageReportMessage",
        "adminToken": ADMIN_TOKEN,
        "reportID": "report-456",
        "resolutionStatus": "resolved"
    }
    
    response = requests.post(f"{BASE_URL}/api/ManageReport", json=payload)
    print(f"ManageReport: {response.status_code}")
    print(f"Response: {response.text}")
    return response

if __name__ == "__main__":
    print("Testing Admin Service APIs...\n")
    
    # Test each API
    test_view_system_stats()
    print("\n" + "="*50 + "\n")
    
    test_ban_user()
    print("\n" + "="*50 + "\n")
    
    test_unban_user()  
    print("\n" + "="*50 + "\n")
    
    test_manage_report()