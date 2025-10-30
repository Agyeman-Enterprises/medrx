from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta
from typing import List

from models import Subscription, SubscriptionCreate, SubscriptionUpdate
from services_data import SUBSCRIPTION_PLANS

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

# MongoDB connection
from database import db

@router.post("/", response_model=dict)
async def create_subscription(subscription_data: SubscriptionCreate):
    """Create new subscription"""
    
    # Get plan info
    plan = SUBSCRIPTION_PLANS.get(subscription_data.planId)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan ID"
        )
    
    # Get or create user
    user = await db.users.find_one({"email": subscription_data.email})
    if not user:
        if not subscription_data.userId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found. Please provide user details."
            )
        user_id = subscription_data.userId
    else:
        user_id = str(user["_id"])
    
    # Check for existing active subscription
    existing = await db.subscriptions.find_one({
        "userId": user_id,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription. Please cancel or upgrade existing subscription."
        )
    
    # Create subscription
    now = datetime.utcnow()
    subscription = {
        "userId": user_id,
        "planId": subscription_data.planId,
        "planName": plan['title'],
        "planTier": plan['tier'],
        "monthlyPrice": plan['price'],
        "status": "active",
        "startDate": now,
        "nextBillingDate": now + timedelta(days=30),  # Simple 30-day billing
        "endDate": None,
        "appointmentsThisMonth": 0,
        "features": plan['features'],
        "createdAt": now,
        "updatedAt": now
    }
    
    result = await db.subscriptions.insert_one(subscription)
    subscription["id"] = str(result.inserted_id)
    subscription["_id"] = str(result.inserted_id)
    
    # Update user's subscriptionId
    from bson import ObjectId
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"subscriptionId": subscription["id"], "updatedAt": now}}
    )
    
    return {
        "success": True,
        "subscriptionId": subscription["id"],
        "message": "Subscription created successfully!",
        "subscription": subscription
    }

@router.get("/user/{user_id}", response_model=dict)
async def get_user_subscription(user_id: str):
    """Get user's active subscription"""
    
    subscription = await db.subscriptions.find_one({
        "userId": user_id,
        "status": "active"
    })
    
    if not subscription:
        return {
            "success": True,
            "subscription": None,
            "message": "No active subscription found"
        }
    
    subscription["id"] = str(subscription["_id"])
    subscription["_id"] = str(subscription["_id"])
    
    return {
        "success": True,
        "subscription": subscription
    }

@router.get("/email/{email}", response_model=dict)
async def get_subscription_by_email(email: str):
    """Get subscription by user email"""
    
    user = await db.users.find_one({"email": email})
    if not user:
        return {
            "success": True,
            "subscription": None,
            "message": "User not found"
        }
    
    user_id = str(user["_id"])
    subscription = await db.subscriptions.find_one({
        "userId": user_id,
        "status": "active"
    })
    
    if not subscription:
        return {
            "success": True,
            "subscription": None,
            "message": "No active subscription found"
        }
    
    subscription["id"] = str(subscription["_id"])
    subscription["_id"] = str(subscription["_id"])
    
    return {
        "success": True,
        "subscription": subscription
    }

@router.patch("/{subscription_id}", response_model=dict)
async def update_subscription(subscription_id: str, update_data: SubscriptionUpdate):
    """Update subscription (upgrade, downgrade, cancel)"""
    
    from bson import ObjectId
    try:
        existing = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription ID"
        )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    update_dict = {"updatedAt": datetime.utcnow()}
    
    # Handle status change
    if update_data.status:
        update_dict["status"] = update_data.status
        if update_data.status == "cancelled":
            update_dict["endDate"] = datetime.utcnow()
    
    # Handle plan change (upgrade/downgrade)
    if update_data.planId:
        plan = SUBSCRIPTION_PLANS.get(update_data.planId)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan ID"
            )
        update_dict["planId"] = update_data.planId
        update_dict["planName"] = plan['title']
        update_dict["planTier"] = plan['tier']
        update_dict["monthlyPrice"] = plan['price']
        update_dict["features"] = plan['features']
        # Reset appointment counter on plan change
        update_dict["appointmentsThisMonth"] = 0
    
    await db.subscriptions.update_one(
        {"_id": ObjectId(subscription_id)},
        {"$set": update_dict}
    )
    
    updated = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])
    
    return {
        "success": True,
        "message": "Subscription updated successfully",
        "subscription": updated
    }

@router.get("/{subscription_id}/usage", response_model=dict)
async def get_subscription_usage(subscription_id: str):
    """Get subscription usage stats"""
    
    from bson import ObjectId
    try:
        subscription = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid subscription ID"
        )
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    plan = SUBSCRIPTION_PLANS.get(subscription['planId'])
    visit_limit = plan.get('visitLimit') if plan else None
    
    return {
        "success": True,
        "usage": {
            "appointmentsThisMonth": subscription['appointmentsThisMonth'],
            "visitLimit": visit_limit,
            "unlimited": visit_limit is None,
            "remainingVisits": None if visit_limit is None else max(0, visit_limit - subscription['appointmentsThisMonth'])
        }
    }
