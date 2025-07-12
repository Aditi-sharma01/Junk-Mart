import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from typing import Dict, Optional

load_dotenv()

# In-memory storage for OTP codes (in production, use Redis or database)
otp_storage: Dict[str, Dict] = {}

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

# Check if email is configured
EMAIL_CONFIGURED = bool(SMTP_USERNAME and SMTP_PASSWORD)

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP code"""
    return ''.join(random.choices(string.digits, k=length))

def store_otp(email: str, otp: str, expires_in_minutes: int = 10) -> None:
    """Store OTP with expiration time"""
    expires_at = datetime.now() + timedelta(minutes=expires_in_minutes)
    otp_storage[email] = {
        'otp': otp,
        'expires_at': expires_at,
        'attempts': 0
    }

def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP code"""
    if email not in otp_storage:
        return False
    
    stored_data = otp_storage[email]
    
    # Check if OTP has expired
    if datetime.now() > stored_data['expires_at']:
        del otp_storage[email]
        return False
    
    # Check if too many attempts
    if stored_data['attempts'] >= 3:
        del otp_storage[email]
        return False
    
    # Increment attempts
    stored_data['attempts'] += 1
    
    # Verify OTP
    if stored_data['otp'] == otp:
        del otp_storage[email]  # Remove after successful verification
        return True
    
    return False

def send_otp_email(email: str, otp: str, username: str) -> bool:
    """Send OTP via email"""
    # If email is not configured, just print the OTP for testing
    if not EMAIL_CONFIGURED:
        print(f"\n{'='*50}")
        print(f"OTP for {email}: {otp}")
        print(f"Username: {username}")
        print(f"{'='*50}\n")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Junk Mart - Email Verification Code"
        
        # Email body
        body = f"""
        <html>
        <body>
            <h2>Welcome to Junk Mart!</h2>
            <p>Hi {username},</p>
            <p>Thank you for signing up! Please use the following verification code to complete your registration:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">{otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Junk Mart Team</p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        # Fallback: print OTP for testing
        print(f"\n{'='*50}")
        print(f"Email failed, but here's the OTP for {email}: {otp}")
        print(f"Username: {username}")
        print(f"{'='*50}\n")
        return True  # Return True so the flow continues

def cleanup_expired_otps():
    """Clean up expired OTP codes"""
    current_time = datetime.now()
    expired_emails = [
        email for email, data in otp_storage.items()
        if current_time > data['expires_at']
    ]
    for email in expired_emails:
        del otp_storage[email] 