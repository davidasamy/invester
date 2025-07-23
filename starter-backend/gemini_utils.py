from google import genai
from yfinance import Ticker

def get_peer_companies(ticker: str): 
    client = genai.Client(
    vertexai=True, project='kir-sprinternship-2025-dev', location='us-central1'
)
    prompt = f'List the 10 most similar stock tickers as {ticker}'
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "temperature": 0.01,
            "response_mime_type": "application/json",
            "response_schema": list[str],
        },
    )

    # Use instantiated objects.
    peer_companies: list[str]= response.parsed

    if (ticker in peer_companies):
        peer_companies.remove(ticker)

    return peer_companies

def get_info(tickers: list[str]) -> dict[str, dict[str, str]]:
    ticker_info = {}
    for tick in tickers:
        ticker_info[tick] = None
        try:
            tick = Ticker(tick)
        except:
            pass
        

    return ticker_info
