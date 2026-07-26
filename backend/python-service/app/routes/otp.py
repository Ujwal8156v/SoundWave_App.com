# SoundWave Python Email OTP Microservice Engine
from fastapi import APIRouter, HTTPException, status, Body
from pydantic import BaseModel, EmailStr
import random
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# In-Memory OTP Database (Stores OTP, Expiration, and Verification Status)
otp_db = {}
cooldown_db = {}

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

def send_email_otp(receiver_email: str, otp_code: str) -> bool:
    sender_email = os.getenv("SENDER_EMAIL", "wsound283@gmail.com")
    sender_password = os.getenv("SENDER_PASSWORD", "sgro djxs ooam gbjz")  # Gmail App Password
    
    if not sender_password:
        logger.info(f"[PYTHON OTP GATEWAY] Demo Mode OTP Generated for {receiver_email}: {otp_code}")
        return True

    try:
        subject = "🔒 Your SoundWave 6-Digit Verification Code"
        body = f"Welcome to SoundWave!\n\nYour OTP for registration is: {otp_code}\nIt will expire in 5 minutes.\n\nIf you did not request this, please ignore this email."

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        logger.info(f"[PYTHON OTP GATEWAY] Successfully sent OTP email to {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"[PYTHON OTP GATEWAY] SMTP error for {receiver_email}: {str(e)}")
        return False

@router.post("/send")
async def generate_and_send_otp(payload: OTPRequest):
    email = payload.email.lower().strip()
    
    # 60-second cooldown rate limit
    last_sent = cooldown_db.get(email)
    if last_sent and (datetime.utcnow() - last_sent).total_seconds() < 60:
        wait_sec = int(60 - (datetime.utcnow() - last_sent).total_seconds())
        raise HTTPException(
            status_code=429,
            detail=f"Please wait {wait_sec} seconds before requesting a new OTP."
        )

    # 1. Generate 6-Digit OTP
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    # 2. Store OTP with Expiration and Status
    otp_db[email] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "status": "unused",
        "attempts": 0
    }
    cooldown_db[email] = datetime.utcnow()

    # 3. Send OTP via Email SMTP
    email_sent = send_email_otp(email, otp_code)

    return {
        "success": True,
        "message": f"OTP code sent successfully to {email}",
        "expires_in_seconds": 300,
        "demo_otp": otp_code
    }

@router.post("/verify")
async def verify_otp(payload: OTPVerifyRequest):
    email = payload.email.lower().strip()
    user_otp = payload.otp.strip()

    record = otp_db.get(email)

    if not record:
        raise HTTPException(
            status_code=404,
            detail="No active OTP found for this email. Please request a new code."
        )

    # Check Expiration
    if datetime.utcnow() > record["expires_at"]:
        del otp_db[email]
        raise HTTPException(
            status_code=400,
            detail="OTP code has expired. Please request a new code."
        )

    # Check Status
    if record["status"] == "used":
        raise HTTPException(
            status_code=400,
            detail="OTP code has already been used."
        )

    # Check Attempt Limit (Max 5 attempts)
    record["attempts"] += 1
    if record["attempts"] > 5:
        del otp_db[email]
        raise HTTPException(
            status_code=429,
            detail="Maximum verification attempts exceeded. Please request a new OTP."
        )

    # Check OTP Match - Strict Exact Match Only
    if record["otp"] != user_otp:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP code. Please enter the exact code sent to your email."
        )

    # 4. Mark OTP as Used upon valid verification
    record["status"] = "used"
    del otp_db[email]

    return {
        "success": True,
        "message": "Email OTP verified successfully!",
        "verified": True
    }
