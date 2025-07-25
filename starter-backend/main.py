from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from gemini_utils import StockValuationService
from sentiment import StockSentimentService


# Create a FastAPI instance
app = FastAPI()
valuation_service = StockValuationService(
        project_id='kir-sprinternship-2025-dev',
        cache_duration=60  # 1 hour cache
    )

sentiment_service = StockSentimentService(
        project_id='kir-sprinternship-2025-dev'
    )

# Mount the static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/value/{stock}")
async def value(stock: str):
    return {"result": valuation_service.get_stock_valuation(stock, 15)}

@app.get("/sentiment/{stock}")
async def sentiment(stock: str):
    return {"result": sentiment_service.get_sentiment(stock)}

@app.get("/peers/{stock}")
async def read_item(stock: str):
    return {"peers": [stock, 'test']}

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,                             # CORS middleware class
    allow_origins=["http://localhost:3000"],    # Only allow requests from this origin
    allow_credentials=True,                     # Lets browser access response cookies, auth headers, etc.
    allow_methods=["*"],                        # Allow all request methods
    allow_headers=["*"],                        # Allow all request headers
)

