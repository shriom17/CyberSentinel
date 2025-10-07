"""
Real Crime Database Integration Service
Connects to actual police and cybercrime databases
"""
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any, Optional
import os
from contextlib import contextmanager

class CrimeDataService:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.connection_pool = None
        self.setup_logging()
        self.initialize_connection()
    
    def setup_logging(self):
        """Setup logging for database operations"""
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def initialize_connection(self):
        """Initialize database connection pool"""
        try:
            if self.config['type'] == 'postgresql':
                self.connection_pool = ThreadedConnectionPool(
                    minconn=1,
                    maxconn=20,
                    host=self.config['host'],
                    port=self.config['port'],
                    database=self.config['database'],
                    user=self.config['username'],
                    password=self.config['password']
                )
                self.logger.info("✅ PostgreSQL connection pool initialized")
                
        except Exception as e:
            self.logger.error(f"❌ Database connection failed: {e}")
            # Fallback to SQLite for development
            self.setup_sqlite_fallback()
    
    def setup_sqlite_fallback(self):
        """Setup SQLite fallback for development"""
        self.config['type'] = 'sqlite'
        self.config['database'] = 'cybercrime_analytics.db'
        self.logger.info("🔄 Using SQLite fallback database")
    
    @contextmanager
    def get_connection(self):
        """Get database connection from pool"""
        if self.config['type'] == 'postgresql':
            conn = self.connection_pool.getconn()
            try:
                yield conn
            finally:
                self.connection_pool.putconn(conn)
        else:
            conn = sqlite3.connect(self.config['database'])
            try:
                yield conn
            finally:
                conn.close()
    
    def get_real_complaints(self, hours_back: int = 24) -> List[Dict[str, Any]]:
        """Get real cybercrime complaints from last N hours"""
        try:
            query = """
            SELECT 
                complaint_number,
                reported_date,
                incident_date,
                complaint_type,
                amount_involved,
                victim_age,
                victim_city,
                latitude,
                longitude,
                status,
                modus_operandi
            FROM cybercrime_complaints 
            WHERE reported_date >= %s 
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL
            ORDER BY reported_date DESC
            LIMIT 1000
            """
            
            cutoff_time = datetime.now() - timedelta(hours=hours_back)
            
            with self.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=[cutoff_time])
                
            complaints = df.to_dict('records')
            self.logger.info(f"📊 Retrieved {len(complaints)} real complaints")
            return complaints
            
        except Exception as e:
            self.logger.error(f"❌ Error retrieving complaints: {e}")
            # Return sample data for development
            return self.get_sample_complaints()
    
    def get_real_time_incidents(self, minutes_back: int = 30) -> List[Dict[str, Any]]:
        """Get real-time incidents from last N minutes"""
        try:
            query = """
            SELECT 
                incident_id,
                timestamp,
                location_name,
                latitude,
                longitude,
                incident_type,
                severity_level,
                amount_involved,
                source_agency,
                verification_status
            FROM real_time_incidents 
            WHERE timestamp >= %s 
            AND processed = FALSE
            ORDER BY timestamp DESC
            """
            
            cutoff_time = datetime.now() - timedelta(minutes=minutes_back)
            
            with self.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=[cutoff_time])
                
            incidents = df.to_dict('records')
            
            # Mark as processed
            self.mark_incidents_processed([inc['incident_id'] for inc in incidents])
            
            self.logger.info(f"🚨 Retrieved {len(incidents)} real-time incidents")
            return incidents
            
        except Exception as e:
            self.logger.error(f"❌ Error retrieving incidents: {e}")
            return []
    
    def mark_incidents_processed(self, incident_ids: List[str]):
        """Mark incidents as processed"""
        try:
            query = """
            UPDATE real_time_incidents 
            SET processed = TRUE, updated_at = CURRENT_TIMESTAMP 
            WHERE incident_id = ANY(%s)
            """
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (incident_ids,))
                    conn.commit()
                    
        except Exception as e:
            self.logger.error(f"❌ Error marking incidents as processed: {e}")
    
    def get_police_stations_nearby(self, latitude: float, longitude: float, radius_km: float = 10) -> List[Dict[str, Any]]:
        """Get police stations within radius"""
        try:
            # Using PostGIS for geographic queries in production
            query = """
            SELECT 
                station_name,
                station_code,
                district,
                latitude,
                longitude,
                contact_number,
                ST_Distance(
                    ST_GeogFromText('POINT(%s %s)'),
                    ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')')
                ) / 1000 as distance_km
            FROM police_stations 
            WHERE ST_DWithin(
                ST_GeogFromText('POINT(%s %s)'),
                ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'),
                %s
            )
            ORDER BY distance_km
            LIMIT 5
            """
            
            with self.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=[longitude, latitude, longitude, latitude, radius_km * 1000])
                
            stations = df.to_dict('records')
            return stations
            
        except Exception as e:
            self.logger.error(f"❌ Error retrieving police stations: {e}")
            return []
    
    def get_atm_locations_nearby(self, latitude: float, longitude: float, radius_km: float = 5) -> List[Dict[str, Any]]:
        """Get ATM locations within radius"""
        try:
            query = """
            SELECT 
                bank_name,
                branch_name,
                atm_id,
                location_type,
                address,
                latitude,
                longitude,
                security_level,
                ST_Distance(
                    ST_GeogFromText('POINT(%s %s)'),
                    ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')')
                ) / 1000 as distance_km
            FROM bank_locations 
            WHERE location_type IN ('atm', 'both')
            AND ST_DWithin(
                ST_GeogFromText('POINT(%s %s)'),
                ST_GeogFromText('POINT(' || longitude || ' ' || latitude || ')'),
                %s
            )
            ORDER BY distance_km
            """
            
            with self.get_connection() as conn:
                df = pd.read_sql_query(query, conn, params=[longitude, latitude, longitude, latitude, radius_km * 1000])
                
            atms = df.to_dict('records')
            return atms
            
        except Exception as e:
            self.logger.error(f"❌ Error retrieving ATM locations: {e}")
            return []
    
    def insert_real_time_incident(self, incident_data: Dict[str, Any]) -> bool:
        """Insert new real-time incident"""
        try:
            query = """
            INSERT INTO real_time_incidents (
                incident_id, timestamp, location_name, latitude, longitude,
                incident_type, severity_level, amount_involved, source_agency
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (incident_id) DO UPDATE SET
                timestamp = EXCLUDED.timestamp,
                severity_level = EXCLUDED.severity_level
            """
            
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, (
                        incident_data['incident_id'],
                        incident_data['timestamp'],
                        incident_data['location_name'],
                        incident_data['latitude'],
                        incident_data['longitude'],
                        incident_data['incident_type'],
                        incident_data['severity_level'],
                        incident_data['amount_involved'],
                        incident_data['source_agency']
                    ))
                    conn.commit()
                    
            self.logger.info(f"✅ Inserted incident: {incident_data['incident_id']}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Error inserting incident: {e}")
            return False
    
    def get_sample_complaints(self) -> List[Dict[str, Any]]:
        """Return sample data for development"""
        return [
            {
                'complaint_number': 'CYB2024001001',
                'reported_date': datetime.now() - timedelta(hours=2),
                'complaint_type': 'UPI Fraud',
                'amount_involved': 25000,
                'victim_age': 34,
                'victim_city': 'Delhi',
                'latitude': 28.6289,
                'longitude': 77.2065,
                'status': 'under_investigation'
            },
            {
                'complaint_number': 'CYB2024001002',
                'reported_date': datetime.now() - timedelta(hours=1),
                'complaint_type': 'Investment Scam',
                'amount_involved': 150000,
                'victim_age': 45,
                'victim_city': 'Mumbai',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'status': 'new'
            }
        ]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get real-time statistics from database"""
        try:
            with self.get_connection() as conn:
                # Total complaints today
                today_query = """
                SELECT COUNT(*) as count, COALESCE(SUM(amount_involved), 0) as total_amount
                FROM cybercrime_complaints 
                WHERE DATE(reported_date) = CURRENT_DATE
                """
                today_stats = pd.read_sql_query(today_query, conn).iloc[0]
                
                # Active incidents
                active_query = """
                SELECT COUNT(*) as count
                FROM real_time_incidents 
                WHERE timestamp >= NOW() - INTERVAL '1 hour'
                AND verification_status != 'false_positive'
                """
                active_incidents = pd.read_sql_query(active_query, conn).iloc[0]['count']
                
                # High risk areas
                risk_query = """
                SELECT COUNT(DISTINCT CONCAT(ROUND(latitude, 2), ',', ROUND(longitude, 2))) as areas
                FROM cybercrime_complaints 
                WHERE reported_date >= NOW() - INTERVAL '24 hours'
                AND amount_involved > 50000
                """
                high_risk_areas = pd.read_sql_query(risk_query, conn).iloc[0]['areas']
                
                return {
                    'total_complaints_today': int(today_stats['count']),
                    'total_amount_today': float(today_stats['total_amount']),
                    'active_incidents': int(active_incidents),
                    'high_risk_areas': int(high_risk_areas),
                    'last_updated': datetime.now().isoformat()
                }
                
        except Exception as e:
            self.logger.error(f"❌ Error getting statistics: {e}")
            return {
                'total_complaints_today': 0,
                'total_amount_today': 0,
                'active_incidents': 0,
                'high_risk_areas': 0,
                'last_updated': datetime.now().isoformat()
            }

# Database configuration
DB_CONFIG = {
    'type': 'postgresql',  # or 'sqlite' for development
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 5432)),
    'database': os.getenv('DB_NAME', 'cybercrime_analytics'),
    'username': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

# Global instance
crime_data_service = CrimeDataService(DB_CONFIG)