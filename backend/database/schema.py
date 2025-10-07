"""
Real Crime Database Schema for Production Integration
"""

# SQL Schema for PostgreSQL/MySQL
CREATE_TABLES_SQL = """
-- Main complaints table
CREATE TABLE cybercrime_complaints (
    id SERIAL PRIMARY KEY,
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    reported_date TIMESTAMP NOT NULL,
    incident_date TIMESTAMP,
    complaint_type VARCHAR(100) NOT NULL,
    amount_involved DECIMAL(15,2),
    victim_age INTEGER,
    victim_gender VARCHAR(10),
    victim_city VARCHAR(100),
    victim_state VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    modus_operandi TEXT,
    status VARCHAR(50) DEFAULT 'new',
    source_system VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time incidents table
CREATE TABLE real_time_incidents (
    id SERIAL PRIMARY KEY,
    incident_id VARCHAR(50) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    location_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    incident_type VARCHAR(100),
    severity_level VARCHAR(20),
    amount_involved DECIMAL(15,2),
    source_agency VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Police stations and jurisdictions
CREATE TABLE police_stations (
    id SERIAL PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    station_code VARCHAR(20) UNIQUE,
    district VARCHAR(100),
    state VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_number VARCHAR(20),
    jurisdiction_area GEOMETRY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banks and ATM locations
CREATE TABLE bank_locations (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(255),
    branch_name VARCHAR(255),
    atm_id VARCHAR(50),
    location_type VARCHAR(20), -- 'branch', 'atm', 'both'
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    operational_hours VARCHAR(100),
    security_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_complaints_date ON cybercrime_complaints(reported_date);
CREATE INDEX idx_complaints_location ON cybercrime_complaints(latitude, longitude);
CREATE INDEX idx_incidents_timestamp ON real_time_incidents(timestamp);
CREATE INDEX idx_incidents_location ON real_time_incidents(latitude, longitude);
"""

# Database connection configuration
DATABASE_CONFIG = {
    'production': {
        'host': 'your-production-db-host',
        'port': 5432,
        'database': 'cybercrime_analytics',
        'username': 'your-db-user',
        'password': 'your-db-password',
        'pool_size': 20,
        'ssl_mode': 'require'
    },
    'staging': {
        'host': 'staging-db-host',
        'port': 5432,
        'database': 'cybercrime_staging',
        'username': 'staging-user',
        'password': 'staging-password'
    }
}