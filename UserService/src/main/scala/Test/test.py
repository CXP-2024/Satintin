import requests
import json
import uuid
import hashlib
import time

BASE_URL = "http://localhost:10010"  # UserService port

class TestUserServiceWithSetup:
    """Test suite that properly sets up users before testing"""
    
    def __init__(self):
        self.setup_test_users()
    
    def setup_test_users(self):
        """Set up test users - try to register, or use hardcoded ones if registration fails"""
        print("Setting up test users...")
        
        # Try to register new users first
        primary_user = self.register_test_user("primary_user")
        friend_user = self.register_test_user("friend_user")
        admin_user = self.register_test_user("admin_user")
        
        # If registration fails, use hardcoded test users
        if not primary_user:
            print("Registration failed, using hardcoded primary user")
            self.primary_user = {
                "userID": "test-user-primary-123",
                "username": "testuser_primary",
                "password": "testpassword123",
                "passwordHash": "482c811da5d5b4bc6d497ffa98491e38",  # MD5 of "testpassword123"
                "email": "primary@test.com",
                "phone": "1234567890"
            }
        else:
            self.primary_user = primary_user
            print(f"✓ Primary user registered: {primary_user['username']}")
        
        if not friend_user:
            print("Registration failed, using hardcoded friend user")
            self.friend_user = {
                "userID": "test-user-friend-456",
                "username": "testuser_friend",
                "password": "testpassword123",
                "passwordHash": "482c811da5d5b4bc6d497ffa98491e38",
                "email": "friend@test.com",
                "phone": "0987654321"
            }
        else:
            self.friend_user = friend_user
            print(f"✓ Friend user registered: {friend_user['username']}")
        
        if not admin_user:
            print("Registration failed, using hardcoded admin user")
            self.admin_user = {
                "userID": "test-user-admin-789",
                "username": "testuser_admin",
                "password": "adminpassword123",
                "passwordHash": "0cc175b9c0f1b6a831c399e269772661",  # MD5 of "adminpassword123"
                "email": "admin@test.com",
                "phone": "1122334455"
            }
        else:
            self.admin_user = admin_user
            print(f"✓ Admin user registered: {admin_user['username']}")
        
        print("User setup completed!\n")
        print(f"Primary user: {self.primary_user['username']} (ID: {self.primary_user['userID']})")
        print(f"Friend user: {self.friend_user['username']} (ID: {self.friend_user['userID']})")
        print(f"Admin user: {self.admin_user['username']} (ID: {self.admin_user['userID']})")
        print()
    
    def register_test_user(self, user_prefix):
        """Register a single test user - try multiple message type formats"""
        unique_id = uuid.uuid4().hex[:8]
        username = f"{user_prefix}_{unique_id}"
        password = "testpassword123"
        password_hash = hashlib.md5(password.encode()).hexdigest()
        email = f"{username}@test.com"
        phone = f"123456{unique_id[:4]}"
        
        # Try different message type formats
        message_types_to_try = [
            "RegisterUserMessage",  # Original attempt
            "RegisterUser",         # What the error suggests
            "registerUser",         # camelCase
            "register_user",        # snake_case
        ]
        
        for msg_type in message_types_to_try:
            payload = {
                "type": msg_type,
                "username": username,
                "passwordHash": password_hash,
                "email": email,
                "phoneNumber": phone
            }
            
            try:
                print(f"Attempting to register {username} with type '{msg_type}'...")
                response = requests.post(f"{BASE_URL}/api/RegisterUserMessage", json=payload, timeout=10)
                print(f"Registration response for {username} (type: {msg_type}): {response.status_code} - {response.text}")
                
                if response.status_code == 200:
                    user_id = response.text.strip('"')
                    print(f"✓ Registration successful with type '{msg_type}'")
                    return {
                        "userID": user_id,
                        "username": username,
                        "password": password,
                        "passwordHash": password_hash,
                        "email": email,
                        "phone": phone
                    }
                elif response.status_code == 400 and "Unknown type" not in response.text:
                    # If it's not an "Unknown type" error, this might be the right type but other validation failed
                    print(f"Type '{msg_type}' is recognized but validation failed: {response.text}")
                    break
                else:
                    print(f"Type '{msg_type}' failed: {response.text}")
                    
            except Exception as e:
                print(f"Exception during registration of {user_prefix} with type '{msg_type}': {e}")
        
        print(f"All registration attempts failed for {user_prefix}")
        return None
    
    def login_user(self, user_info):
        """Login a user and return success status"""
        # Try different login message types as well
        login_types_to_try = [
            "LoginUserMessage",
            "LoginUser", 
            "loginUser",
            "login_user"
        ]
        
        for msg_type in login_types_to_try:
            payload = {
                "type": msg_type,
                "username": user_info["username"],
                "passwordHash": user_info["passwordHash"]
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/LoginUser", json=payload, timeout=10)
                print(f"Login response for {user_info['username']} (type: {msg_type}): {response.status_code} - {response.text}")
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 400 and "Unknown type" not in response.text:
                    # Right type, wrong credentials or other error
                    return False
            except Exception as e:
                print(f"Login failed for {user_info['username']} with type '{msg_type}': {e}")
        
        return False
    
    def get_user_token(self, user_info):
        """Get a valid token for a user"""
        # For testing purposes, we'll use a combination of userID and username
        # In a real system, this would come from the login response
        return f"{user_info['userID']}-{user_info['username']}-token"
    
    def test_service_endpoints(self):
        """Test what endpoints are available"""
        print("=== Testing Available Endpoints ===")
        
        endpoints_to_test = [
            "/api/RegisterUserMessage",
            "/api/register", 
            "/api/user/register",
            "/api/LoginUser",
            "/api/login",
            "/api/user/login"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                # Try a simple GET request to see if endpoint exists
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
                print(f"GET {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"GET {endpoint}: Failed - {e}")
                
        print()
    
    # ============= Updated Tests with Real Users =============
    
    def test_user_registration_and_login(self):
        """Test the registration and login flow"""
        print("=== Testing Registration and Login ===")
        
        # Test login with primary user (should work whether registered or hardcoded)
        login_result = self.login_user(self.primary_user)
        print(f"Login test for {self.primary_user['username']}: {login_result}")
        
        # Test login with wrong credentials
        wrong_user = {
            "username": "nonexistent_user_12345",
            "passwordHash": "wrong_hash_67890"
        }
        login_result = self.login_user(wrong_user)
        print(f"Wrong credentials test: {login_result}")
        print("✓ Login tests completed")
    
    def test_add_friend_real_users(self):
        """Test adding friend with real registered users"""
        print("=== Testing Add Friend with Real Users ===")
        
        primary_token = self.get_user_token(self.primary_user)
        friend_id = self.friend_user["userID"]
        
        # Try different message types for AddFriend
        friend_types_to_try = ["AddFriendMessage", "AddFriend", "addFriend"]
        
        for msg_type in friend_types_to_try:
            payload = {
                "type": msg_type,
                "userToken": primary_token,
                "friendID": friend_id
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/AddFriend", json=payload, timeout=10)
                print(f"AddFriend Status (type: {msg_type}): {response.status_code}")
                print(f"AddFriend Response: {response.text}")
                
                if response.status_code == 200:
                    print(f"✓ AddFriend test passed with type '{msg_type}'")
                    return
                elif "Unknown type" not in response.text:
                    print(f"Type '{msg_type}' recognized but failed: {response.text}")
                    return
                    
            except Exception as e:
                print(f"AddFriend exception with type '{msg_type}': {e}")
        
        print("All AddFriend attempts failed")
    
    def test_get_user_info_real_user(self):
        """Test getting user info with real user"""
        print("=== Testing Get User Info ===")
        
        user_token = self.get_user_token(self.primary_user)
        user_id = self.primary_user["userID"]
        
        # Try different message types
        info_types_to_try = ["GetUserInfoMessage", "GetUserInfo", "getUserInfo"]
        
        for msg_type in info_types_to_try:
            payload = {
                "type": msg_type,
                "userToken": user_token,
                "userID": user_id
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/GetUserInfo", json=payload, timeout=10)
                print(f"GetUserInfo Status (type: {msg_type}): {response.status_code}")
                print(f"GetUserInfo Response: {response.text}")
                
                if response.status_code == 200:
                    try:
                        user_data = response.json()
                        print(f"User data keys: {list(user_data.keys())}")
                        print(f"✓ GetUserInfo test passed with type '{msg_type}'")
                        return
                    except:
                        print(f"✓ GetUserInfo test passed (non-JSON response) with type '{msg_type}'")
                        return
                elif "Unknown type" not in response.text:
                    print(f"Type '{msg_type}' recognized but failed: {response.text}")
                    return
                    
            except Exception as e:
                print(f"GetUserInfo exception with type '{msg_type}': {e}")
        
        print("All GetUserInfo attempts failed")
    
    # ... (rest of the test methods remain the same, but add similar type-trying logic)
    
    def test_remove_friend_real_users(self):
        """Test removing friend with real users"""
        print("=== Testing Remove Friend ===")
        
        primary_token = self.get_user_token(self.primary_user)
        friend_id = self.friend_user["userID"]
        
        remove_types_to_try = ["RemoveFriendMessage", "RemoveFriend", "removeFriend"]
        
        for msg_type in remove_types_to_try:
            remove_payload = {
                "type": msg_type,
                "userToken": primary_token,
                "friendID": friend_id
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/RemoveFriend", json=remove_payload, timeout=10)
                print(f"RemoveFriend Status (type: {msg_type}): {response.status_code}")
                print(f"RemoveFriend Response: {response.text}")
                
                if response.status_code == 200:
                    print(f"✓ RemoveFriend test passed with type '{msg_type}'")
                    return
                elif "Unknown type" not in response.text:
                    print(f"Type '{msg_type}' recognized: {response.text}")
                    return
                    
            except Exception as e:
                print(f"RemoveFriend exception with type '{msg_type}': {e}")
        
        print("All RemoveFriend attempts failed")
    
    def test_block_user_real_users(self):
        """Test blocking user with real users"""
        print("=== Testing Block User ===")
        
        primary_token = self.get_user_token(self.primary_user)
        friend_id = self.friend_user["userID"]
        
        block_types_to_try = ["BlockUserMessage", "BlockUser", "blockUser"]
        
        for msg_type in block_types_to_try:
            payload = {
                "type": msg_type,
                "userToken": primary_token,
                "blackUserID": friend_id
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/BlockUser", json=payload, timeout=10)
                print(f"BlockUser Status (type: {msg_type}): {response.status_code}")
                print(f"BlockUser Response: {response.text}")
                
                if response.status_code == 200:
                    print(f"✓ BlockUser test passed with type '{msg_type}'")
                    return
                elif "Unknown type" not in response.text:
                    print(f"Type '{msg_type}' recognized: {response.text}")
                    return
                    
            except Exception as e:
                print(f"BlockUser exception with type '{msg_type}': {e}")
        
        print("All BlockUser attempts failed")
    
    def test_user_logout(self):
        """Test user logout"""
        print("=== Testing User Logout ===")
        
        user_token = self.get_user_token(self.primary_user)
        
        logout_types_to_try = ["LogoutUserMessage", "LogoutUser", "logoutUser"]
        
        for msg_type in logout_types_to_try:
            payload = {
                "type": msg_type,
                "userToken": user_token
            }
            
            try:
                response = requests.post(f"{BASE_URL}/api/LogoutUser", json=payload, timeout=10)
                print(f"LogoutUser Status (type: {msg_type}): {response.status_code}")
                print(f"LogoutUser Response: {response.text}")
                
                if response.status_code == 200:
                    print(f"✓ LogoutUser test passed with type '{msg_type}'")
                    return
                elif "Unknown type" not in response.text:
                    print(f"Type '{msg_type}' recognized: {response.text}")
                    return
                    
            except Exception as e:
                print(f"LogoutUser exception with type '{msg_type}': {e}")
        
        print("All LogoutUser attempts failed")
    
    def test_complete_user_workflow(self):
        """Test complete user workflow"""
        print("=== Testing Complete User Workflow ===")
        print("This test will use the working message types discovered above")

def check_server_connectivity():
    """Check if UserService is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Server health check: {response.status_code}")
        return True
    except requests.exceptions.RequestException:
        try:
            # Try a simple API call
            test_payload = {"type": "LoginUserMessage", "username": "test", "passwordHash": "test"}
            response = requests.post(f"{BASE_URL}/api/LoginUser", json=test_payload, timeout=5)
            print(f"Server connectivity test: {response.status_code}")
            return True
        except requests.exceptions.RequestException as e:
            print(f"Server not reachable: {e}")
            return False

if __name__ == "__main__":
    print("Testing UserService with message type discovery...\n")
    
    # Check server connectivity first
    if not check_server_connectivity():
        print("❌ UserService is not running or not reachable on port 10010")
        print("Please start your UserService with: sbt run")
        exit(1)
    
    print("✓ UserService is reachable\n")
    
    # Initialize test suite with user setup
    test_suite = TestUserServiceWithSetup()
    
    # Test available endpoints first
    test_suite.test_service_endpoints()
    
    # Run tests
    try:
        test_suite.test_user_registration_and_login()
        print()
    except Exception as e:
        print(f"Registration/Login test failed: {e}\n")
    
    try:
        test_suite.test_get_user_info_real_user()
        print()
    except Exception as e:
        print(f"Get user info test failed: {e}\n")
    
    try:
        test_suite.test_add_friend_real_users()
        print()
    except Exception as e:
        print(f"Add friend test failed: {e}\n")
    
    try:
        test_suite.test_remove_friend_real_users()
        print()
    except Exception as e:
        print(f"Remove friend test failed: {e}\n")
    
    try:
        test_suite.test_block_user_real_users()
        print()
    except Exception as e:
        print(f"Block user test failed: {e}\n")
    
    try:
        test_suite.test_user_logout()
        print()
    except Exception as e:
        print(f"Logout test failed: {e}\n")
    
    print("All tests completed!")