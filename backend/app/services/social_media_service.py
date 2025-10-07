"""
Social Media Monitoring Service
Monitors social platforms for cybercrime patterns and threats
"""
import tweepy
import asyncio
import aiohttp
from datetime import datetime, timedelta
import re
import json
import logging
from typing import List, Dict, Any, Optional
import nltk
from textblob import TextBlob
import os
from dataclasses import dataclass

@dataclass
class SocialMediaAlert:
    platform: str
    post_id: str
    user_id: str
    content: str
    threat_type: str
    confidence_score: float
    timestamp: datetime
    engagement_metrics: Dict[str, int]
    location: Optional[Dict[str, float]] = None
    hashtags: Optional[List[str]] = None

class SocialMediaMonitoringService:
    def __init__(self):
        self.setup_logging()
        self.load_api_credentials()
        self.setup_fraud_keywords()
        self.setup_sentiment_analyzer()
        
    def setup_logging(self):
        """Setup logging for social media monitoring"""
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def load_api_credentials(self):
        """Load API credentials for different platforms"""
        self.twitter_api = self.setup_twitter_api()
        self.telegram_config = {
            'bot_token': os.getenv('TELEGRAM_BOT_TOKEN'),
            'chat_ids': os.getenv('TELEGRAM_CHAT_IDS', '').split(',')
        }
        self.whatsapp_config = {
            'api_key': os.getenv('WHATSAPP_API_KEY'),
            'phone_number': os.getenv('WHATSAPP_PHONE_NUMBER')
        }
        
    def setup_twitter_api(self):
        """Setup Twitter API client"""
        try:
            # Twitter API v2 credentials
            bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
            if bearer_token:
                return tweepy.Client(bearer_token=bearer_token)
            else:
                self.logger.warning("⚠️ Twitter API credentials not found")
                return None
        except Exception as e:
            self.logger.error(f"❌ Twitter API setup failed: {e}")
            return None
    
    def setup_fraud_keywords(self):
        """Setup fraud detection keywords and patterns"""
        self.fraud_keywords = {
            'investment_scam': [
                'guaranteed returns', 'double your money', 'risk-free investment',
                'quick profit', 'earn lakhs', 'trading tips', 'stock tips',
                'crypto investment', 'forex trading', 'binary options'
            ],
            'romance_scam': [
                'dating profile', 'fake profile', 'love scam', 'online dating fraud',
                'military officer', 'engineer abroad', 'widow/widower'
            ],
            'phishing': [
                'verify account', 'suspended account', 'click link',
                'update payment', 'confirm identity', 'security alert'
            ],
            'job_fraud': [
                'work from home', 'part-time job', 'easy money',
                'data entry', 'copy paste job', 'survey job'
            ],
            'loan_fraud': [
                'instant loan', 'no documentation', 'bad credit ok',
                'loan without documents', 'quick approval'
            ],
            'tech_support_scam': [
                'computer virus', 'microsoft support', 'technical support',
                'remote access', 'fix computer', 'malware detected'
            ]
        }
        
        # Compile regex patterns
        self.fraud_patterns = {}
        for category, keywords in self.fraud_keywords.items():
            pattern = '|'.join([re.escape(keyword) for keyword in keywords])
            self.fraud_patterns[category] = re.compile(pattern, re.IGNORECASE)
    
    def setup_sentiment_analyzer(self):
        """Setup sentiment analysis tools"""
        try:
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            from nltk.sentiment import SentimentIntensityAnalyzer
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except Exception as e:
            self.logger.error(f"❌ Sentiment analyzer setup failed: {e}")
            self.sentiment_analyzer = None
    
    async def monitor_twitter_mentions(self, keywords: List[str]) -> List[SocialMediaAlert]:
        """Monitor Twitter for fraud-related mentions"""
        alerts = []
        
        if not self.twitter_api:
            return alerts
            
        try:
            # Search for tweets with fraud-related keywords
            search_query = ' OR '.join([f'"{keyword}"' for keyword in keywords])
            search_query += ' -is:retweet lang:en OR lang:hi'
            
            # Get recent tweets
            tweets = self.twitter_api.search_recent_tweets(
                query=search_query,
                max_results=100,
                tweet_fields=['created_at', 'author_id', 'public_metrics', 'geo'],
                user_fields=['location'],
                expansions=['author_id']
            )
            
            if tweets.data:
                for tweet in tweets.data:
                    # Analyze tweet content for fraud patterns
                    threat_type, confidence = self.analyze_fraud_content(tweet.text)
                    
                    if confidence > 0.6:  # Threshold for potential fraud
                        alert = SocialMediaAlert(
                            platform='Twitter',
                            post_id=tweet.id,
                            user_id=tweet.author_id,
                            content=tweet.text[:500],  # Truncate long content
                            threat_type=threat_type,
                            confidence_score=confidence,
                            timestamp=tweet.created_at,
                            engagement_metrics={
                                'retweets': tweet.public_metrics['retweet_count'],
                                'likes': tweet.public_metrics['like_count'],
                                'replies': tweet.public_metrics['reply_count']
                            },
                            hashtags=self.extract_hashtags(tweet.text)
                        )
                        alerts.append(alert)
            
            self.logger.info(f"📱 Twitter: Found {len(alerts)} potential fraud alerts")
            
        except Exception as e:
            self.logger.error(f"❌ Twitter monitoring error: {e}")
            
        return alerts
    
    async def monitor_telegram_channels(self, channel_ids: List[str]) -> List[SocialMediaAlert]:
        """Monitor Telegram channels for fraud activities"""
        alerts = []
        
        if not self.telegram_config['bot_token']:
            return alerts
            
        try:
            base_url = f"https://api.telegram.org/bot{self.telegram_config['bot_token']}"
            
            async with aiohttp.ClientSession() as session:
                for channel_id in channel_ids:
                    # Get recent messages from channel
                    url = f"{base_url}/getUpdates"
                    params = {
                        'chat_id': channel_id,
                        'limit': 100,
                        'offset': -100
                    }
                    
                    async with session.get(url, params=params) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            for message in data.get('result', []):
                                if 'message' in message:
                                    msg = message['message']
                                    text = msg.get('text', '')
                                    
                                    if text:
                                        threat_type, confidence = self.analyze_fraud_content(text)
                                        
                                        if confidence > 0.7:
                                            alert = SocialMediaAlert(
                                                platform='Telegram',
                                                post_id=str(msg['message_id']),
                                                user_id=str(msg.get('from', {}).get('id', 'unknown')),
                                                content=text[:500],
                                                threat_type=threat_type,
                                                confidence_score=confidence,
                                                timestamp=datetime.fromtimestamp(msg['date']),
                                                engagement_metrics={'views': 0}
                                            )
                                            alerts.append(alert)
            
            self.logger.info(f"📱 Telegram: Found {len(alerts)} potential fraud alerts")
            
        except Exception as e:
            self.logger.error(f"❌ Telegram monitoring error: {e}")
            
        return alerts
    
    async def monitor_whatsapp_business(self) -> List[SocialMediaAlert]:
        """Monitor WhatsApp Business API for fraud reports"""
        alerts = []
        
        if not self.whatsapp_config['api_key']:
            return alerts
            
        try:
            # WhatsApp Business API endpoint
            url = f"https://graph.facebook.com/v17.0/{self.whatsapp_config['phone_number']}/messages"
            headers = {
                'Authorization': f"Bearer {self.whatsapp_config['api_key']}",
                'Content-Type': 'application/json'
            }
            
            # This would typically be webhook-based, but for polling:
            async with aiohttp.ClientSession() as session:
                # Get recent messages (this is simplified - actual implementation 
                # would use webhooks for real-time monitoring)
                params = {
                    'fields': 'messages',
                    'limit': 50
                }
                
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for message in data.get('messages', []):
                            text = message.get('text', {}).get('body', '')
                            
                            if text:
                                threat_type, confidence = self.analyze_fraud_content(text)
                                
                                if confidence > 0.8:  # Higher threshold for WhatsApp
                                    alert = SocialMediaAlert(
                                        platform='WhatsApp',
                                        post_id=message['id'],
                                        user_id=message['from'],
                                        content=text[:500],
                                        threat_type=threat_type,
                                        confidence_score=confidence,
                                        timestamp=datetime.fromtimestamp(int(message['timestamp'])),
                                        engagement_metrics={'delivered': 1}
                                    )
                                    alerts.append(alert)
            
            self.logger.info(f"📱 WhatsApp: Found {len(alerts)} potential fraud alerts")
            
        except Exception as e:
            self.logger.error(f"❌ WhatsApp monitoring error: {e}")
            
        return alerts
    
    def analyze_fraud_content(self, content: str) -> tuple[str, float]:
        """Analyze content for fraud patterns and return threat type and confidence"""
        if not content:
            return 'unknown', 0.0
            
        content_lower = content.lower()
        max_confidence = 0.0
        detected_type = 'unknown'
        
        # Check against fraud patterns
        for fraud_type, pattern in self.fraud_patterns.items():
            matches = pattern.findall(content)
            if matches:
                # Calculate confidence based on number of matches and content length
                confidence = min(0.9, (len(matches) * 0.2) + (len(' '.join(matches)) / len(content)))
                
                if confidence > max_confidence:
                    max_confidence = confidence
                    detected_type = fraud_type
        
        # Additional heuristics
        if any(word in content_lower for word in ['scam', 'fraud', 'cheat', 'fake']):
            max_confidence = min(1.0, max_confidence + 0.3)
        
        # Check for urgent language
        urgent_words = ['urgent', 'immediately', 'hurry', 'limited time', 'act now']
        if any(word in content_lower for word in urgent_words):
            max_confidence = min(1.0, max_confidence + 0.1)
        
        # Check for money-related terms
        money_words = ['money', 'cash', 'payment', 'transfer', 'account', 'bank']
        money_count = sum(1 for word in money_words if word in content_lower)
        if money_count >= 2:
            max_confidence = min(1.0, max_confidence + 0.1)
        
        return detected_type, max_confidence
    
    def extract_hashtags(self, text: str) -> List[str]:
        """Extract hashtags from text"""
        return re.findall(r'#\w+', text)
    
    def get_sentiment_score(self, text: str) -> float:
        """Get sentiment score for text"""
        if self.sentiment_analyzer:
            try:
                scores = self.sentiment_analyzer.polarity_scores(text)
                return scores['compound']
            except:
                pass
        
        # Fallback to TextBlob
        try:
            blob = TextBlob(text)
            return blob.sentiment.polarity
        except:
            return 0.0
    
    async def monitor_all_platforms(self) -> List[SocialMediaAlert]:
        """Monitor all integrated social media platforms"""
        try:
            # Define monitoring keywords
            fraud_keywords = [
                'online fraud', 'cyber fraud', 'scam alert', 'fraud warning',
                'fake website', 'phishing', 'investment scam', 'romance scam'
            ]
            
            # Monitor all platforms concurrently
            tasks = [
                self.monitor_twitter_mentions(fraud_keywords),
                self.monitor_telegram_channels(self.telegram_config['chat_ids']),
                self.monitor_whatsapp_business()
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            all_alerts = []
            for result in results:
                if isinstance(result, list):
                    all_alerts.extend(result)
                elif isinstance(result, Exception):
                    self.logger.error(f"❌ Platform monitoring failed: {result}")
            
            # Sort by confidence score
            all_alerts.sort(key=lambda x: x.confidence_score, reverse=True)
            
            self.logger.info(f"📱 Total social media alerts: {len(all_alerts)}")
            return all_alerts
            
        except Exception as e:
            self.logger.error(f"❌ Error monitoring platforms: {e}")
            return []
    
    def convert_alerts_to_incidents(self, alerts: List[SocialMediaAlert]) -> List[Dict[str, Any]]:
        """Convert social media alerts to incident format"""
        incidents = []
        
        for alert in alerts:
            incident = {
                'incident_id': f"SOCIAL_{alert.platform}_{alert.post_id}",
                'timestamp': alert.timestamp.isoformat(),
                'location_name': f"{alert.platform} Social Media",
                'latitude': alert.location.get('lat', 28.6139) if alert.location else 28.6139,
                'longitude': alert.location.get('lng', 77.2090) if alert.location else 77.2090,
                'incident_type': f"Social_Media_{alert.threat_type}",
                'severity_level': 'high' if alert.confidence_score > 0.8 else 'medium',
                'amount_involved': 0,  # Not applicable for social media
                'source_agency': f"{alert.platform}_MONITORING",
                'verification_status': 'pending',
                'additional_data': {
                    'platform': alert.platform,
                    'user_id': alert.user_id,
                    'content_preview': alert.content[:200],
                    'threat_type': alert.threat_type,
                    'confidence_score': alert.confidence_score,
                    'engagement_metrics': alert.engagement_metrics,
                    'hashtags': alert.hashtags,
                    'sentiment_score': self.get_sentiment_score(alert.content)
                }
            }
            incidents.append(incident)
        
        return incidents
    
    def get_social_media_statistics(self, alerts: List[SocialMediaAlert]) -> Dict[str, Any]:
        """Get statistics from social media alerts"""
        if not alerts:
            return {
                'total_alerts': 0,
                'high_confidence_alerts': 0,
                'platform_breakdown': {},
                'threat_type_breakdown': {},
                'trending_hashtags': []
            }
        
        platform_counts = {}
        threat_counts = {}
        all_hashtags = []
        
        for alert in alerts:
            # Platform breakdown
            platform_counts[alert.platform] = platform_counts.get(alert.platform, 0) + 1
            
            # Threat type breakdown
            threat_counts[alert.threat_type] = threat_counts.get(alert.threat_type, 0) + 1
            
            # Collect hashtags
            if alert.hashtags:
                all_hashtags.extend(alert.hashtags)
        
        # Top hashtags
        hashtag_counts = {}
        for hashtag in all_hashtags:
            hashtag_counts[hashtag] = hashtag_counts.get(hashtag, 0) + 1
        
        trending_hashtags = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            'total_alerts': len(alerts),
            'high_confidence_alerts': len([a for a in alerts if a.confidence_score > 0.8]),
            'platform_breakdown': platform_counts,
            'threat_type_breakdown': threat_counts,
            'trending_hashtags': trending_hashtags,
            'average_confidence': sum(a.confidence_score for a in alerts) / len(alerts)
        }

# Global instance
social_media_service = SocialMediaMonitoringService()