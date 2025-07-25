from typing import Optional
from google import genai
from yfinance import Ticker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockSentimentService:
    def __init__(self, project_id: Optional[str] = None, location: str = 'us-central1'):
        # Initialize AI client if provided
        self.ai_client = None
        if project_id:
            try:
                self.ai_client = genai.Client(vertexai=True, project=project_id, location=location)
            except Exception as e:
                logger.warning(f"AI client initialization failed: {e}")

    def get_sentiment(self, stock: str) -> str:
        tick = Ticker("AAPL")
        news = tick.get_news(10)
        features = []

        for new in news:
            news_info = {}
            print(new["content"].keys())
            news_info["contentType"] = new["content"]["contentType"]
            news_info["title"] = new["content"]["title"]
            news_info["summary"] = new["content"]["summary"]
            news_info["description"] = new["content"]["description"]
            news_info["pubDate"] = new["content"]["pubDate"]
            news_info["publisher"] = new["content"]["provider"]['displayName']
            features.append(news_info)
        

        prompt = f"You are a market trends analyst. You have read the following news articles / video. Tell us what do you think of {stock} in the coming months. \n \n {features}"

        response = self.ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.3,
                "response_mime_type": "application/json",
                "response_schema": str,
            },
        )
        
        sentiment_analysis = response.parsed
        return sentiment_analysis
