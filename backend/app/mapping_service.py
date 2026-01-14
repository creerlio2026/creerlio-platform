"""
Mapping Service
Handles geocoding, route calculation, and location-based queries
"""

import os
from typing import Dict, List, Optional, Tuple
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from sqlalchemy.orm import Session

class MappingService:
    """Service for mapping, geocoding, and route calculation"""
    
    def __init__(self):
        # Initialize geocoding services
        self.mapbox_api_key = os.getenv("MAPBOX_API_KEY")
        
        # Use Nominatim for geocoding (free, no API key required)
        # Mapbox is used on the frontend for map display
        self.geocoder = Nominatim(user_agent="creerlio-platform")
    
    async def geocode_address(self, address: str) -> Dict:
        """
        Geocode an address to coordinates
        
        Args:
            address: Address string to geocode
            
        Returns:
            Dictionary with location data including lat, lng, formatted_address
        """
        try:
            location = self.geocoder.geocode(address)
            
            if not location:
                raise ValueError(f"Could not geocode address: {address}")
            
            return {
                "latitude": location.latitude,
                "longitude": location.longitude,
                "formatted_address": location.address,
                "raw": location.raw if hasattr(location, 'raw') else {}
            }
        except Exception as e:
            raise Exception(f"Geocoding error: {str(e)}")
    
    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict:
        """
        Reverse geocode coordinates to address
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Dictionary with address information
        """
        try:
            location = self.geocoder.reverse(f"{latitude}, {longitude}")
            
            if not location:
                raise ValueError(f"Could not reverse geocode coordinates: {latitude}, {longitude}")
            
            return {
                "formatted_address": location.address,
                "latitude": latitude,
                "longitude": longitude,
                "raw": location.raw if hasattr(location, 'raw') else {}
            }
        except Exception as e:
            raise Exception(f"Reverse geocoding error: {str(e)}")
    
    async def calculate_route(
        self,
        origin: str,
        destination: str,
        mode: str = "driving"
    ) -> Dict:
        """
        Calculate route between two locations
        
        Args:
            origin: Starting address or coordinates
            destination: Destination address or coordinates
            mode: Travel mode (driving, walking, bicycling, transit)
            
        Returns:
            Dictionary with route information including distance, duration, steps
        """
        try:
            # Calculate straight-line distance using geopy
            # For detailed routing, use Mapbox on the frontend
            origin_coords = await self.geocode_address(origin)
            dest_coords = await self.geocode_address(destination)
            
            origin_point = (origin_coords['latitude'], origin_coords['longitude'])
            dest_point = (dest_coords['latitude'], dest_coords['longitude'])
            
            distance_km = geodesic(origin_point, dest_point).kilometers
            
            return {
                "distance": {
                    "text": f"{distance_km:.2f} km",
                    "value": distance_km * 1000  # meters
                },
                "duration": {
                    "text": "N/A (straight-line distance)",
                    "value": None
                },
                "start_address": origin_coords['formatted_address'],
                "end_address": dest_coords['formatted_address'],
                "steps": [],
                "polyline": None,
                "note": "Straight-line distance only. Use Mapbox on frontend for detailed routing."
            }
        except Exception as e:
            raise Exception(f"Route calculation error: {str(e)}")
    
    async def get_nearby_businesses(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        db: Optional[Session] = None
    ) -> List[Dict]:
        """
        Get businesses within radius of coordinates
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers
            db: Database session
            
        Returns:
            List of business dictionaries with distance information
        """
        if not db:
            return []
        
        try:
            from app.models import BusinessProfile
            
            # Get all businesses with coordinates
            businesses = db.query(BusinessProfile).filter(
                BusinessProfile.latitude.isnot(None),
                BusinessProfile.longitude.isnot(None),
                BusinessProfile.is_active == True
            ).all()
            
            center_point = (latitude, longitude)
            nearby_businesses = []
            
            for business in businesses:
                if business.latitude and business.longitude:
                    business_point = (business.latitude, business.longitude)
                    distance_km = geodesic(center_point, business_point).kilometers
                    
                    if distance_km <= radius_km:
                        business_dict = {
                            "id": business.id,
                            "name": business.name,
                            "description": business.description,
                            "address": business.address,
                            "location": business.location,
                            "latitude": business.latitude,
                            "longitude": business.longitude,
                            "distance_km": round(distance_km, 2)
                        }
                        nearby_businesses.append(business_dict)
            
            # Sort by distance
            nearby_businesses.sort(key=lambda x: x['distance_km'])
            
            return nearby_businesses
            
        except Exception as e:
            raise Exception(f"Error finding nearby businesses: {str(e)}")
    
    async def get_nearby_talent(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        db: Optional[Session] = None
    ) -> List[Dict]:
        """
        Get talent profiles within radius of coordinates
        
        Args:
            latitude: Center latitude
            longitude: Center longitude
            radius_km: Search radius in kilometers
            db: Database session
            
        Returns:
            List of talent dictionaries with distance information
        """
        if not db:
            return []
        
        try:
            from app.models import TalentProfile
            
            # Get all talent with coordinates
            talents = db.query(TalentProfile).filter(
                TalentProfile.latitude.isnot(None),
                TalentProfile.longitude.isnot(None),
                TalentProfile.is_active == True
            ).all()
            
            center_point = (latitude, longitude)
            nearby_talents = []
            
            for talent in talents:
                if talent.latitude and talent.longitude:
                    talent_point = (talent.latitude, talent.longitude)
                    distance_km = geodesic(center_point, talent_point).kilometers
                    
                    if distance_km <= radius_km:
                        talent_dict = {
                            "id": talent.id,
                            "name": talent.name,
                            "title": talent.title,
                            "skills": talent.skills,
                            "location": talent.location,
                            "latitude": talent.latitude,
                            "longitude": talent.longitude,
                            "distance_km": round(distance_km, 2)
                        }
                        nearby_talents.append(talent_dict)
            
            # Sort by distance
            nearby_talents.sort(key=lambda x: x['distance_km'])
            
            return nearby_talents
            
        except Exception as e:
            raise Exception(f"Error finding nearby talent: {str(e)}")
    
    def calculate_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate distance between two coordinates in kilometers
        
        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            
        Returns:
            Distance in kilometers
        """
        point1 = (lat1, lon1)
        point2 = (lat2, lon2)
        return geodesic(point1, point2).kilometers



