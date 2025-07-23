from google import genai

def get_peer_companies(ticker: str): 
    client = genai.Client(
    vertexai=True, project='kir-sprinternship-2025-dev', location='us-central1'
)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"List the 10 most similar stock tickers as {ticker}",
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
