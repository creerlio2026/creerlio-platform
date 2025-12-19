"""
Initialize manual profiles for 1 Talent and 1 Business
Run this script to create default profiles for development
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app.models import User, TalentProfile, BusinessProfile
from app.auth import create_user, get_user_by_email
from app.auth import UserRegister

def init_profiles():
    """Create 1 Talent and 1 Business profile manually"""
    db = SessionLocal()
    try:
        init_db()
        
        # Create Talent User
        talent_email = "talent@creerlio.local"
        talent_user = get_user_by_email(db, talent_email)
        if not talent_user:
            talent_user_data = UserRegister(
                email=talent_email,
                username="talent_user",
                full_name="John Talent",
                user_type="talent"
            )
            talent_user = create_user(db, talent_user_data)
            print(f"✅ Created Talent User: {talent_email}")
        else:
            print(f"ℹ️  Talent User already exists: {talent_email}")
        
        # Create Talent Profile
        talent_profile = db.query(TalentProfile).filter(TalentProfile.email == talent_email).first()
        if not talent_profile:
            talent_profile = TalentProfile(
                name="John Talent",
                email=talent_email,
                title="Software Developer",
                bio="Experienced software developer looking for opportunities",
                skills=["Python", "JavaScript", "React", "Node.js"],
                experience_years=5,
                city="Sydney",
                country="Australia",
                is_active=True
            )
            db.add(talent_profile)
            db.commit()
            db.refresh(talent_profile)
            
            # Link talent profile to user
            talent_user.talent_profile_id = talent_profile.id
            db.commit()
            print(f"✅ Created Talent Profile: {talent_profile.id}")
        else:
            print(f"ℹ️  Talent Profile already exists: {talent_profile.id}")
        
        # Create Business User
        business_email = "business@creerlio.local"
        business_user = get_user_by_email(db, business_email)
        if not business_user:
            business_user_data = UserRegister(
                email=business_email,
                username="business_user",
                full_name="Acme Corporation",
                user_type="business"
            )
            business_user = create_user(db, business_user_data)
            print(f"✅ Created Business User: {business_email}")
        else:
            print(f"ℹ️  Business User already exists: {business_email}")
        
        # Create Business Profile
        business_profile = db.query(BusinessProfile).filter(BusinessProfile.email == business_email).first()
        if not business_profile:
            business_profile = BusinessProfile(
                name="Acme Corporation",
                email=business_email,
                industry="Technology",
                description="Leading technology company looking for top talent",
                website="https://acme.example.com",
                city="Sydney",
                country="Australia",
                is_active=True
            )
            db.add(business_profile)
            db.commit()
            db.refresh(business_profile)
            
            # Link business profile to user
            business_user.business_profile_id = business_profile.id
            db.commit()
            print(f"✅ Created Business Profile: {business_profile.id}")
        else:
            print(f"ℹ️  Business Profile already exists: {business_profile.id}")
        
        print("\n✅ Profile initialization complete!")
        print(f"   Talent: {talent_email}")
        print(f"   Business: {business_email}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing profiles: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_profiles()
