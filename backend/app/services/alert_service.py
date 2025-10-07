"""
SMS/Email Alert System for Real-Time Crime Notifications
Sends alerts to law enforcement and stakeholders
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta
import json
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
from jinja2 import Template
import csv
import io

@dataclass
class AlertRecipient:
    name: str
    phone: str
    email: str
    role: str
    jurisdiction: str
    priority_level: int  # 1=highest, 5=lowest
    preferred_method: str  # 'sms', 'email', 'both'

@dataclass
class Alert:
    alert_id: str
    incident_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    location: Dict[str, Any]
    timestamp: datetime
    amount_involved: Optional[float] = None
    additional_data: Optional[Dict[str, Any]] = None

class AlertNotificationService:
    def __init__(self):
        self.setup_logging()
        self.load_configurations()
        self.load_recipients()
        self.setup_templates()
        
    def setup_logging(self):
        """Setup logging for alert notifications"""
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_configurations(self):
        """Load SMS and email configurations"""
        # Email configuration
        self.email_config = {
            'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.getenv('SMTP_PORT', 587)),
            'username': os.getenv('EMAIL_USERNAME'),
            'password': os.getenv('EMAIL_PASSWORD'),
            'from_email': os.getenv('FROM_EMAIL'),
            'use_tls': True
        }
        
        # SMS configurations for different providers
        self.sms_configs = {
            'twilio': {
                'account_sid': os.getenv('TWILIO_ACCOUNT_SID'),
                'auth_token': os.getenv('TWILIO_AUTH_TOKEN'),
                'from_number': os.getenv('TWILIO_FROM_NUMBER'),
                'api_url': 'https://api.twilio.com/2010-04-01/Accounts/{}/Messages.json'
            },
            'msg91': {
                'auth_key': os.getenv('MSG91_AUTH_KEY'),
                'sender_id': os.getenv('MSG91_SENDER_ID'),
                'route': '4',  # Transactional SMS
                'api_url': 'https://api.msg91.com/api/v5/sms/'
            },
            'textlocal': {
                'api_key': os.getenv('TEXTLOCAL_API_KEY'),
                'sender': os.getenv('TEXTLOCAL_SENDER'),
                'api_url': 'https://api.textlocal.in/send/'
            }
        }
        
        # WhatsApp Business API
        self.whatsapp_config = {
            'access_token': os.getenv('WHATSAPP_ACCESS_TOKEN'),
            'phone_number_id': os.getenv('WHATSAPP_PHONE_NUMBER_ID'),
            'api_url': f"https://graph.facebook.com/v17.0/{os.getenv('WHATSAPP_PHONE_NUMBER_ID')}/messages"
        }
        
    def load_recipients(self):
        """Load alert recipients from database/config"""
        # In production, this would load from database
        self.recipients = [
            AlertRecipient(
                name="DCP Cyber Crime",
                phone="+919876543210",
                email="dcp.cyber@delhipolice.gov.in",
                role="senior_officer",
                jurisdiction="Delhi",
                priority_level=1,
                preferred_method="both"
            ),
            AlertRecipient(
                name="ACP Cyber Cell",
                phone="+919876543211",
                email="acp.cyber@delhipolice.gov.in",
                role="investigating_officer",
                jurisdiction="Delhi",
                priority_level=2,
                preferred_method="sms"
            ),
            AlertRecipient(
                name="Inspector Cyber Unit",
                phone="+919876543212",
                email="inspector.cyber@delhipolice.gov.in",
                role="field_officer",
                jurisdiction="Delhi",
                priority_level=3,
                preferred_method="both"
            ),
            AlertRecipient(
                name="CERT-In SOC",
                phone="+911123456789",
                email="soc@cert-in.org.in",
                role="cyber_security",
                jurisdiction="National",
                priority_level=1,
                preferred_method="email"
            ),
            AlertRecipient(
                name="Bank Fraud Team",
                phone="+911187654321",
                email="fraud.team@rbi.org.in",
                role="financial_crimes",
                jurisdiction="National",
                priority_level=2,
                preferred_method="both"
            )
        ]
        
    def setup_templates(self):
        """Setup email and SMS templates"""
        # Email templates
        self.email_templates = {
            'critical_alert': """
            <html>
            <body>
                <h2 style="color: #d32f2f;">🚨 CRITICAL CYBERCRIME ALERT</h2>
                <p><strong>Alert ID:</strong> {{ alert.alert_id }}</p>
                <p><strong>Time:</strong> {{ alert.timestamp.strftime('%Y-%m-%d %H:%M:%S') }}</p>
                <p><strong>Type:</strong> {{ alert.alert_type }}</p>
                <p><strong>Severity:</strong> <span style="color: #d32f2f; font-weight: bold;">{{ alert.severity.upper() }}</span></p>
                
                <h3>Incident Details</h3>
                <p><strong>Title:</strong> {{ alert.title }}</p>
                <p><strong>Description:</strong> {{ alert.message }}</p>
                
                <h3>Location Information</h3>
                <p><strong>Area:</strong> {{ alert.location.area }}</p>
                <p><strong>City:</strong> {{ alert.location.city }}</p>
                <p><strong>Coordinates:</strong> {{ alert.location.latitude }}, {{ alert.location.longitude }}</p>
                
                {% if alert.amount_involved %}
                <h3>Financial Impact</h3>
                <p><strong>Amount Involved:</strong> ₹{{ "{:,.2f}".format(alert.amount_involved) }}</p>
                {% endif %}
                
                <h3>Recommended Actions</h3>
                <ul>
                    <li>Immediate investigation required</li>
                    <li>Coordinate with local police station</li>
                    <li>Monitor for related incidents</li>
                    <li>Update incident status in system</li>
                </ul>
                
                <p style="color: #666; font-size: 12px;">
                    This is an automated alert from the Cybercrime Prediction System.<br>
                    Generated at: {{ datetime.now().strftime('%Y-%m-%d %H:%M:%S') }}
                </p>
            </body>
            </html>
            """,
            
            'high_alert': """
            <html>
            <body>
                <h2 style="color: #ff9800;">⚠️ HIGH PRIORITY CYBERCRIME ALERT</h2>
                <p><strong>Alert ID:</strong> {{ alert.alert_id }}</p>
                <p><strong>Time:</strong> {{ alert.timestamp.strftime('%Y-%m-%d %H:%M:%S') }}</p>
                <p><strong>Type:</strong> {{ alert.alert_type }}</p>
                
                <h3>Incident Summary</h3>
                <p>{{ alert.message }}</p>
                
                <p><strong>Location:</strong> {{ alert.location.city }}</p>
                {% if alert.amount_involved %}
                <p><strong>Amount:</strong> ₹{{ "{:,.2f}".format(alert.amount_involved) }}</p>
                {% endif %}
                
                <p>Please investigate within 2 hours.</p>
            </body>
            </html>
            """
        }
        
        # SMS templates
        self.sms_templates = {
            'critical_alert': "🚨 CRITICAL ALERT: {{ alert.title }} at {{ alert.location.city }}. Amount: ₹{{ alert.amount_involved or 'Unknown' }}. Immediate action required. ID: {{ alert.alert_id }}",
            
            'high_alert': "⚠️ HIGH ALERT: {{ alert.alert_type }} detected at {{ alert.location.city }}. {% if alert.amount_involved %}₹{{ alert.amount_involved }} involved. {% endif %}Investigate within 2hrs. ID: {{ alert.alert_id }}",
            
            'medium_alert': "📢 ALERT: {{ alert.alert_type }} - {{ alert.location.city }}. ID: {{ alert.alert_id }}. Check system for details.",
            
            'daily_summary': "📊 Daily Summary: {{ total_incidents }} incidents, ₹{{ total_amount }} involved. {{ high_priority_count }} high priority cases pending."
        }
        
    def get_relevant_recipients(self, alert: Alert) -> List[AlertRecipient]:
        """Get recipients based on alert severity and jurisdiction"""
        relevant_recipients = []
        
        severity_priority_map = {
            'critical': [1, 2],
            'high': [1, 2, 3],
            'medium': [1, 2, 3, 4],
            'low': [3, 4, 5]
        }
        
        max_priority = severity_priority_map.get(alert.severity, [5])
        
        for recipient in self.recipients:
            # Check priority level
            if recipient.priority_level in max_priority:
                # Check jurisdiction
                if (recipient.jurisdiction == 'National' or 
                    recipient.jurisdiction == alert.location.get('city', '') or
                    alert.severity in ['critical', 'high']):
                    relevant_recipients.append(recipient)
        
        return relevant_recipients
    
    async def send_sms_twilio(self, phone: str, message: str) -> bool:
        """Send SMS using Twilio"""
        try:
            config = self.sms_configs['twilio']
            if not config['account_sid'] or not config['auth_token']:
                return False
                
            url = config['api_url'].format(config['account_sid'])
            
            data = {
                'From': config['from_number'],
                'To': phone,
                'Body': message[:1600]  # SMS length limit
            }
            
            auth = aiohttp.BasicAuth(config['account_sid'], config['auth_token'])
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=data, auth=auth) as response:
                    if response.status == 201:
                        self.logger.info(f"📱 SMS sent to {phone} via Twilio")
                        return True
                    else:
                        self.logger.error(f"❌ Twilio SMS failed: {response.status}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"❌ Twilio SMS error: {e}")
            return False
    
    async def send_sms_msg91(self, phone: str, message: str) -> bool:
        """Send SMS using MSG91 (India)"""
        try:
            config = self.sms_configs['msg91']
            if not config['auth_key']:
                return False
                
            headers = {
                'Content-Type': 'application/json',
                'authkey': config['auth_key']
            }
            
            # Remove country code if present for MSG91
            clean_phone = phone.replace('+91', '').replace('+', '')
            
            data = {
                'sender': config['sender_id'],
                'route': config['route'],
                'country': '91',
                'sms': [{
                    'message': message[:1600],
                    'to': [clean_phone]
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(config['api_url'], headers=headers, json=data) as response:
                    if response.status == 200:
                        self.logger.info(f"📱 SMS sent to {phone} via MSG91")
                        return True
                    else:
                        self.logger.error(f"❌ MSG91 SMS failed: {response.status}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"❌ MSG91 SMS error: {e}")
            return False
    
    async def send_sms(self, phone: str, message: str) -> bool:
        """Send SMS using available provider"""
        # Try MSG91 first for Indian numbers
        if phone.startswith('+91'):
            success = await self.send_sms_msg91(phone, message)
            if success:
                return True
        
        # Fallback to Twilio
        return await self.send_sms_twilio(phone, message)
    
    def send_email(self, email: str, subject: str, html_content: str, attachments: List[str] = None) -> bool:
        """Send email notification"""
        try:
            if not self.email_config['username'] or not self.email_config['password']:
                self.logger.warning("⚠️ Email credentials not configured")
                return False
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_config['from_email'] or self.email_config['username']
            msg['To'] = email
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Add attachments if any
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename= {os.path.basename(file_path)}'
                            )
                            msg.attach(part)
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                if self.email_config['use_tls']:
                    server.starttls(context=context)
                server.login(self.email_config['username'], self.email_config['password'])
                server.send_message(msg)
            
            self.logger.info(f"📧 Email sent to {email}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Email sending error: {e}")
            return False
    
    async def send_whatsapp_message(self, phone: str, message: str) -> bool:
        """Send WhatsApp message using Business API"""
        try:
            if not self.whatsapp_config['access_token']:
                return False
                
            headers = {
                'Authorization': f"Bearer {self.whatsapp_config['access_token']}",
                'Content-Type': 'application/json'
            }
            
            # Clean phone number
            clean_phone = phone.replace('+', '').replace(' ', '')
            
            data = {
                'messaging_product': 'whatsapp',
                'to': clean_phone,
                'type': 'text',
                'text': {
                    'body': message[:4096]  # WhatsApp message limit
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.whatsapp_config['api_url'], headers=headers, json=data) as response:
                    if response.status == 200:
                        self.logger.info(f"📱 WhatsApp sent to {phone}")
                        return True
                    else:
                        self.logger.error(f"❌ WhatsApp failed: {response.status}")
                        return False
                        
        except Exception as e:
            self.logger.error(f"❌ WhatsApp error: {e}")
            return False
    
    async def send_alert(self, alert: Alert) -> Dict[str, Any]:
        """Send alert to relevant recipients"""
        try:
            recipients = self.get_relevant_recipients(alert)
            
            if not recipients:
                self.logger.warning(f"⚠️ No recipients found for alert {alert.alert_id}")
                return {'success': False, 'error': 'No recipients'}
            
            # Prepare templates
            template_key = f"{alert.severity}_alert" if f"{alert.severity}_alert" in self.email_templates else "high_alert"
            
            # Render email template
            email_template = Template(self.email_templates[template_key])
            email_content = email_template.render(alert=alert, datetime=datetime)
            
            # Render SMS template
            sms_template_key = f"{alert.severity}_alert" if f"{alert.severity}_alert" in self.sms_templates else "high_alert"
            sms_template = Template(self.sms_templates[sms_template_key])
            sms_content = sms_template.render(alert=alert)
            
            # Send notifications
            results = {
                'alert_id': alert.alert_id,
                'recipients_notified': 0,
                'emails_sent': 0,
                'sms_sent': 0,
                'whatsapp_sent': 0,
                'failures': []
            }
            
            for recipient in recipients:
                try:
                    notifications_sent = False
                    
                    # Send email
                    if recipient.preferred_method in ['email', 'both']:
                        subject = f"🚨 {alert.severity.upper()} CYBERCRIME ALERT - {alert.alert_type}"
                        if self.send_email(recipient.email, subject, email_content):
                            results['emails_sent'] += 1
                            notifications_sent = True
                    
                    # Send SMS
                    if recipient.preferred_method in ['sms', 'both']:
                        if await self.send_sms(recipient.phone, sms_content):
                            results['sms_sent'] += 1
                            notifications_sent = True
                    
                    # Send WhatsApp for critical alerts
                    if alert.severity == 'critical':
                        if await self.send_whatsapp_message(recipient.phone, sms_content):
                            results['whatsapp_sent'] += 1
                            notifications_sent = True
                    
                    if notifications_sent:
                        results['recipients_notified'] += 1
                    else:
                        results['failures'].append(f"Failed to notify {recipient.name}")
                        
                except Exception as e:
                    results['failures'].append(f"Error notifying {recipient.name}: {str(e)}")
            
            results['success'] = results['recipients_notified'] > 0
            
            self.logger.info(f"📢 Alert {alert.alert_id}: Notified {results['recipients_notified']} recipients")
            return results
            
        except Exception as e:
            self.logger.error(f"❌ Alert sending error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def send_daily_summary(self, summary_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send daily summary to all recipients"""
        try:
            # Prepare summary content
            email_content = f"""
            <html>
            <body>
                <h2>📊 Daily Cybercrime Summary - {datetime.now().strftime('%Y-%m-%d')}</h2>
                
                <h3>Key Statistics</h3>
                <ul>
                    <li><strong>Total Incidents:</strong> {summary_data['total_incidents']}</li>
                    <li><strong>Total Amount Involved:</strong> ₹{summary_data['total_amount']:,.2f}</li>
                    <li><strong>High Priority Cases:</strong> {summary_data['high_priority_count']}</li>
                    <li><strong>Resolved Cases:</strong> {summary_data['resolved_count']}</li>
                    <li><strong>Pending Cases:</strong> {summary_data['pending_count']}</li>
                </ul>
                
                <h3>Top Fraud Types</h3>
                <ol>
                    {"".join([f"<li>{fraud_type}: {count} cases</li>" for fraud_type, count in summary_data['top_fraud_types']])}
                </ol>
                
                <h3>High Risk Areas</h3>
                <ol>
                    {"".join([f"<li>{area}: {count} incidents</li>" for area, count in summary_data['high_risk_areas']])}
                </ol>
                
                <p style="color: #666; font-size: 12px;">
                    Generated by Cybercrime Prediction System at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </body>
            </html>
            """
            
            # SMS summary
            sms_template = Template(self.sms_templates['daily_summary'])
            sms_content = sms_template.render(**summary_data)
            
            # Send to all recipients
            results = {'emails_sent': 0, 'sms_sent': 0}
            
            for recipient in self.recipients:
                if recipient.priority_level <= 3:  # Send summary to senior officers only
                    # Email
                    subject = f"Daily Cybercrime Summary - {datetime.now().strftime('%Y-%m-%d')}"
                    if self.send_email(recipient.email, subject, email_content):
                        results['emails_sent'] += 1
                    
                    # SMS for critical recipients only
                    if recipient.priority_level <= 2:
                        await self.send_sms(recipient.phone, sms_content)
                        results['sms_sent'] += 1
            
            self.logger.info(f"📊 Daily summary sent: {results['emails_sent']} emails, {results['sms_sent']} SMS")
            return results
            
        except Exception as e:
            self.logger.error(f"❌ Daily summary error: {e}")
            return {'error': str(e)}
    
    def create_incident_report_csv(self, incidents: List[Dict[str, Any]]) -> str:
        """Create CSV report of incidents"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = ['Incident ID', 'Timestamp', 'Type', 'Location', 'Amount', 'Status', 'Severity']
            writer.writerow(headers)
            
            # Data rows
            for incident in incidents:
                writer.writerow([
                    incident.get('incident_id', ''),
                    incident.get('timestamp', ''),
                    incident.get('incident_type', ''),
                    f"{incident.get('location', {}).get('city', '')}",
                    incident.get('amount_involved', 0),
                    incident.get('verification_status', ''),
                    incident.get('severity_level', '')
                ])
            
            # Save to file
            filename = f"incident_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            filepath = f"reports/{filename}"
            os.makedirs('reports', exist_ok=True)
            
            with open(filepath, 'w', newline='') as f:
                f.write(output.getvalue())
            
            return filepath
            
        except Exception as e:
            self.logger.error(f"❌ CSV report error: {e}")
            return ""

# Global instance
alert_service = AlertNotificationService()