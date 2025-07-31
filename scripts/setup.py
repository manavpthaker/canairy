#!/usr/bin/env python3
"""
Initial setup wizard for household resilience monitoring system.
"""

import yaml
import os
from pathlib import Path

def main():
    print("🏠 Household Resilience Monitoring Setup")
    print("=========================================")
    
    # Check if secrets.yaml exists
    secrets_path = Path("config/secrets.yaml")
    if not secrets_path.exists():
        print("\n📧 Setting up notification credentials...")
        create_secrets_file()
    
    # Test configuration
    print("\n🧪 Testing configuration...")
    test_config()
    
    print("\n✅ Setup complete!")
    print("\nNext steps:")
    print("1. Run: python src/main.py --check-status")
    print("2. Set up scheduled monitoring (cron/task scheduler)")
    print("3. Test notifications")

def create_secrets_file():
    """Interactive creation of secrets.yaml file."""
    secrets = {
        'email': {},
        'sms': {},
        'api_keys': {}
    }
    
    print("\nEmail notification setup:")
    secrets['email']['from_email'] = input("Your email address: ")
    secrets['email']['password'] = input("Email app password: ")
    secrets['email']['to_primary'] = input("Primary alert email: ")
    secrets['email']['to_secondary'] = input("Secondary alert email (optional): ")
    
    print("\nSMS setup (optional - press Enter to skip):")
    twilio_sid = input("Twilio Account SID (optional): ")
    if twilio_sid:
        secrets['sms']['twilio_sid'] = twilio_sid
        secrets['sms']['twilio_token'] = input("Twilio Auth Token: ")
        secrets['sms']['twilio_from'] = input("From phone number: ")
        secrets['sms']['sms_to_primary'] = input("Primary SMS number: ")
    
    # Save secrets file
    with open("config/secrets.yaml", "w") as f:
        yaml.dump(secrets, f, default_flow_style=False)
    
    print("✅ Secrets file created")

def test_config():
    """Test that configuration is valid."""
    try:
        with open("config/config.yaml", "r") as f:
            config = yaml.safe_load(f)
        print("✅ Main configuration valid")
        
        if Path("config/secrets.yaml").exists():
            with open("config/secrets.yaml", "r") as f:
                secrets = yaml.safe_load(f)
            print("✅ Secrets configuration valid")
        else:
            print("⚠️ No secrets file found - notifications won't work")
        
    except Exception as e:
        print(f"❌ Configuration error: {e}")

if __name__ == "__main__":
    main()
