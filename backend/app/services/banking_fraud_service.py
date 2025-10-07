"""
Banking Fraud API Integration Service
Connects to bank fraud detection systems and payment gateways
"""
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta
import json
import logging
from typing import List, Dict, Any, Optional
import hashlib
import hmac
from dataclasses import dataclass
import os

@dataclass
class FraudAlert:
    transaction_id: str
    bank_name: str
    amount: float
    victim_account: str
    fraud_type: str
    confidence_score: float
    timestamp: datetime
    location: Optional[Dict[str, float]] = None
    additional_data: Optional[Dict[str, Any]] = None

class BankingFraudAPIService:
    def __init__(self):
        self.api_configs = self.load_api_configurations()
        self.session = requests.Session()
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging for API operations"""
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_api_configurations(self) -> Dict[str, Dict[str, str]]:
        """Load API configurations for different banks and payment systems"""
        return {
            'rbi_fraud_registry': {
                'base_url': 'https://api.rbi.gov.in/fraud-registry/v1',
                'api_key': os.getenv('RBI_API_KEY'),
                'secret': os.getenv('RBI_API_SECRET'),
                'timeout': 30
            },
            'npci_fraud_monitoring': {
                'base_url': 'https://api.npci.org.in/fraud-monitor/v2',
                'api_key': os.getenv('NPCI_API_KEY'),
                'secret': os.getenv('NPCI_API_SECRET'),
                'timeout': 15
            },
            'paytm_fraud_api': {
                'base_url': 'https://api.paytm.com/fraud-detection/v1',
                'merchant_id': os.getenv('PAYTM_MERCHANT_ID'),
                'api_key': os.getenv('PAYTM_API_KEY'),
                'timeout': 10
            },
            'phonepe_fraud_api': {
                'base_url': 'https://api.phonepe.com/fraud-alerts/v1',
                'merchant_id': os.getenv('PHONEPE_MERCHANT_ID'),
                'api_key': os.getenv('PHONEPE_API_KEY'),
                'timeout': 10
            },
            'googlepay_fraud_api': {
                'base_url': 'https://api.googlepay.com/fraud-detection/v1',
                'client_id': os.getenv('GOOGLEPAY_CLIENT_ID'),
                'api_key': os.getenv('GOOGLEPAY_API_KEY'),
                'timeout': 10
            },
            'sbi_fraud_monitoring': {
                'base_url': 'https://api.sbi.co.in/fraud-monitor/v1',
                'client_id': os.getenv('SBI_CLIENT_ID'),
                'api_key': os.getenv('SBI_API_KEY'),
                'timeout': 20
            },
            'hdfc_fraud_alerts': {
                'base_url': 'https://api.hdfcbank.com/fraud-alerts/v1',
                'client_id': os.getenv('HDFC_CLIENT_ID'),
                'api_key': os.getenv('HDFC_API_KEY'),
                'timeout': 20
            },
            'icici_fraud_system': {
                'base_url': 'https://api.icicibank.com/fraud-detection/v1',
                'client_id': os.getenv('ICICI_CLIENT_ID'),
                'api_key': os.getenv('ICICI_API_KEY'),
                'timeout': 20
            }
        }
    
    def generate_signature(self, data: str, secret: str) -> str:
        """Generate HMAC signature for API authentication"""
        return hmac.new(
            secret.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    async def fetch_rbi_fraud_alerts(self) -> List[FraudAlert]:
        """Fetch fraud alerts from RBI Fraud Registry"""
        try:
            config = self.api_configs['rbi_fraud_registry']
            if not config['api_key']:
                return []
                
            url = f"{config['base_url']}/fraud-alerts"
            headers = {
                'Authorization': f"Bearer {config['api_key']}",
                'Content-Type': 'application/json'
            }
            
            params = {
                'from_date': (datetime.now() - timedelta(hours=1)).isoformat(),
                'to_date': datetime.now().isoformat(),
                'fraud_types': 'digital_payment,upi,net_banking,card_fraud'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=config['timeout']) as response:
                    if response.status == 200:
                        data = await response.json()
                        alerts = []
                        
                        for alert_data in data.get('fraud_alerts', []):
                            alert = FraudAlert(
                                transaction_id=alert_data['transaction_id'],
                                bank_name=alert_data['bank_name'],
                                amount=float(alert_data['amount']),
                                victim_account=alert_data['victim_account'][-4:],  # Last 4 digits only
                                fraud_type=alert_data['fraud_type'],
                                confidence_score=float(alert_data['confidence_score']),
                                timestamp=datetime.fromisoformat(alert_data['timestamp']),
                                location=alert_data.get('location'),
                                additional_data=alert_data.get('additional_info')
                            )
                            alerts.append(alert)
                        
                        self.logger.info(f"📊 RBI: Retrieved {len(alerts)} fraud alerts")
                        return alerts
                        
        except Exception as e:
            self.logger.error(f"❌ RBI API Error: {e}")
            return []
    
    async def fetch_npci_upi_frauds(self) -> List[FraudAlert]:
        """Fetch UPI fraud alerts from NPCI"""
        try:
            config = self.api_configs['npci_fraud_monitoring']
            if not config['api_key']:
                return []
                
            url = f"{config['base_url']}/upi-frauds"
            
            # Generate timestamp and signature
            timestamp = str(int(datetime.now().timestamp()))
            signature_data = f"{config['api_key']}{timestamp}"
            signature = self.generate_signature(signature_data, config['secret'])
            
            headers = {
                'X-API-Key': config['api_key'],
                'X-Timestamp': timestamp,
                'X-Signature': signature,
                'Content-Type': 'application/json'
            }
            
            payload = {
                'time_range': {
                    'start': (datetime.now() - timedelta(minutes=30)).isoformat(),
                    'end': datetime.now().isoformat()
                },
                'fraud_categories': ['unauthorized_transaction', 'account_takeover', 'social_engineering']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload, timeout=config['timeout']) as response:
                    if response.status == 200:
                        data = await response.json()
                        alerts = []
                        
                        for fraud_data in data.get('frauds', []):
                            alert = FraudAlert(
                                transaction_id=fraud_data['upi_ref'],
                                bank_name=fraud_data['psp_name'],
                                amount=float(fraud_data['amount']),
                                victim_account=fraud_data['vpa'].split('@')[0][-4:],
                                fraud_type=f"UPI_{fraud_data['fraud_category']}",
                                confidence_score=float(fraud_data['risk_score']),
                                timestamp=datetime.fromisoformat(fraud_data['transaction_time']),
                                location=fraud_data.get('location_data')
                            )
                            alerts.append(alert)
                        
                        self.logger.info(f"📊 NPCI: Retrieved {len(alerts)} UPI frauds")
                        return alerts
                        
        except Exception as e:
            self.logger.error(f"❌ NPCI API Error: {e}")
            return []
    
    async def fetch_payment_app_frauds(self, app_name: str) -> List[FraudAlert]:
        """Fetch fraud alerts from payment apps (PayTM, PhonePe, GooglePay)"""
        try:
            config = self.api_configs.get(f'{app_name.lower()}_fraud_api')
            if not config or not config['api_key']:
                return []
                
            url = f"{config['base_url']}/fraud-alerts"
            headers = {
                'Authorization': f"Bearer {config['api_key']}",
                'X-Merchant-ID': config.get('merchant_id', config.get('client_id')),
                'Content-Type': 'application/json'
            }
            
            params = {
                'since': (datetime.now() - timedelta(minutes=15)).isoformat(),
                'limit': 100,
                'status': 'confirmed'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=config['timeout']) as response:
                    if response.status == 200:
                        data = await response.json()
                        alerts = []
                        
                        for fraud_data in data.get('alerts', []):
                            alert = FraudAlert(
                                transaction_id=fraud_data['transaction_id'],
                                bank_name=app_name,
                                amount=float(fraud_data['amount']),
                                victim_account=fraud_data['user_id'][-4:],
                                fraud_type=fraud_data['fraud_type'],
                                confidence_score=float(fraud_data['confidence']),
                                timestamp=datetime.fromisoformat(fraud_data['detected_at']),
                                location=fraud_data.get('device_location'),
                                additional_data={
                                    'device_info': fraud_data.get('device_info'),
                                    'merchant_category': fraud_data.get('merchant_category')
                                }
                            )
                            alerts.append(alert)
                        
                        self.logger.info(f"📊 {app_name}: Retrieved {len(alerts)} fraud alerts")
                        return alerts
                        
        except Exception as e:
            self.logger.error(f"❌ {app_name} API Error: {e}")
            return []
    
    async def fetch_bank_fraud_alerts(self, bank_name: str) -> List[FraudAlert]:
        """Fetch fraud alerts from major banks"""
        try:
            config = self.api_configs.get(f'{bank_name.lower()}_fraud_alerts', 
                                        self.api_configs.get(f'{bank_name.lower()}_fraud_system'))
            if not config or not config['api_key']:
                return []
                
            url = f"{config['base_url']}/fraud-alerts"
            headers = {
                'Authorization': f"Bearer {config['api_key']}",
                'X-Client-ID': config.get('client_id'),
                'Content-Type': 'application/json'
            }
            
            payload = {
                'time_filter': {
                    'from': (datetime.now() - timedelta(hours=2)).isoformat(),
                    'to': datetime.now().isoformat()
                },
                'channels': ['internet_banking', 'mobile_banking', 'atm', 'pos'],
                'minimum_amount': 1000
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=payload, timeout=config['timeout']) as response:
                    if response.status == 200:
                        data = await response.json()
                        alerts = []
                        
                        for fraud_data in data.get('fraud_cases', []):
                            alert = FraudAlert(
                                transaction_id=fraud_data['reference_id'],
                                bank_name=bank_name.upper(),
                                amount=float(fraud_data['transaction_amount']),
                                victim_account=fraud_data['account_number'][-4:],
                                fraud_type=fraud_data['fraud_category'],
                                confidence_score=float(fraud_data['fraud_score']),
                                timestamp=datetime.fromisoformat(fraud_data['transaction_datetime']),
                                location=fraud_data.get('transaction_location'),
                                additional_data={
                                    'channel': fraud_data.get('channel'),
                                    'merchant_details': fraud_data.get('merchant_info')
                                }
                            )
                            alerts.append(alert)
                        
                        self.logger.info(f"📊 {bank_name}: Retrieved {len(alerts)} fraud alerts")
                        return alerts
                        
        except Exception as e:
            self.logger.error(f"❌ {bank_name} API Error: {e}")
            return []
    
    async def fetch_all_fraud_alerts(self) -> List[FraudAlert]:
        """Fetch fraud alerts from all integrated sources"""
        try:
            tasks = [
                self.fetch_rbi_fraud_alerts(),
                self.fetch_npci_upi_frauds(),
                self.fetch_payment_app_frauds('paytm'),
                self.fetch_payment_app_frauds('phonepe'),
                self.fetch_payment_app_frauds('googlepay'),
                self.fetch_bank_fraud_alerts('sbi'),
                self.fetch_bank_fraud_alerts('hdfc'),
                self.fetch_bank_fraud_alerts('icici')
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            all_alerts = []
            for result in results:
                if isinstance(result, list):
                    all_alerts.extend(result)
                elif isinstance(result, Exception):
                    self.logger.error(f"❌ Task failed: {result}")
            
            # Remove duplicates based on transaction_id
            unique_alerts = {}
            for alert in all_alerts:
                if alert.transaction_id not in unique_alerts:
                    unique_alerts[alert.transaction_id] = alert
            
            final_alerts = list(unique_alerts.values())
            self.logger.info(f"🎯 Total unique fraud alerts: {len(final_alerts)}")
            
            return final_alerts
            
        except Exception as e:
            self.logger.error(f"❌ Error fetching all fraud alerts: {e}")
            return []
    
    def convert_alerts_to_incidents(self, alerts: List[FraudAlert]) -> List[Dict[str, Any]]:
        """Convert fraud alerts to incident format for processing"""
        incidents = []
        
        for alert in alerts:
            incident = {
                'incident_id': f"FRAUD_{alert.transaction_id}",
                'timestamp': alert.timestamp.isoformat(),
                'location_name': f"{alert.bank_name} Transaction",
                'latitude': alert.location.get('lat', 28.6139) if alert.location else 28.6139,
                'longitude': alert.location.get('lng', 77.2090) if alert.location else 77.2090,
                'incident_type': alert.fraud_type,
                'severity_level': 'critical' if alert.amount > 100000 else 'high' if alert.amount > 50000 else 'medium',
                'amount_involved': alert.amount,
                'source_agency': f"{alert.bank_name}_FRAUD_API",
                'verification_status': 'verified' if alert.confidence_score > 0.8 else 'pending',
                'additional_data': {
                    'victim_account_suffix': alert.victim_account,
                    'confidence_score': alert.confidence_score,
                    'bank_name': alert.bank_name,
                    'fraud_type': alert.fraud_type,
                    'additional_info': alert.additional_data
                }
            }
            incidents.append(incident)
        
        return incidents
    
    def get_fraud_statistics(self, alerts: List[FraudAlert]) -> Dict[str, Any]:
        """Get statistics from fraud alerts"""
        if not alerts:
            return {
                'total_frauds': 0,
                'total_amount': 0,
                'high_confidence_frauds': 0,
                'top_fraud_types': [],
                'top_banks_affected': []
            }
        
        total_amount = sum(alert.amount for alert in alerts)
        high_confidence = len([a for a in alerts if a.confidence_score > 0.8])
        
        # Top fraud types
        fraud_types = {}
        for alert in alerts:
            fraud_types[alert.fraud_type] = fraud_types.get(alert.fraud_type, 0) + 1
        
        top_fraud_types = sorted(fraud_types.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Top banks affected
        banks = {}
        for alert in alerts:
            banks[alert.bank_name] = banks.get(alert.bank_name, 0) + 1
        
        top_banks = sorted(banks.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'total_frauds': len(alerts),
            'total_amount': total_amount,
            'high_confidence_frauds': high_confidence,
            'top_fraud_types': top_fraud_types,
            'top_banks_affected': top_banks,
            'average_amount': total_amount / len(alerts) if alerts else 0
        }

# Global instance
banking_fraud_service = BankingFraudAPIService()