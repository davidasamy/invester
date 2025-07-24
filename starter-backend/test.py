from dcf import calculate_dcf_with_llm_rates 
from dcf import dcf_data
from dcf import get_projected_growth_rates
from gemini_utils import get_peer_companies
import json


projection_years = 5
target_ticker = "GOOG" 
perpetual_growth_rate = 0.025 
discount_rate = 0.1
print(calculate_dcf_with_llm_rates("GOOG"))  

financial_data_test = dcf_data("GOOG")
if financial_data_test:
    print(json.dumps(financial_data_test, indent=4))
else:
    print(f"get_financial_data failed for {target_ticker}.")

print("\n" + "="*40 + "\n")

projected_rates_test = get_projected_growth_rates("GOOG", 5)
if projected_rates_test:
    print(f"Projected Growth Rates from Gemini for {target_ticker} over {projection_years} years:")
    print(json.dumps(projected_rates_test, indent=4))
else:
    print(f"get_projected_growth_rates failed for {target_ticker}.")

print("\n" + "="*40 + "\n")

dcf_results = calculate_dcf_with_llm_rates(
    ticker=target_ticker,
    perpetual_growth_rate=perpetual_growth_rate,
    discount_rate=discount_rate
)

if dcf_results:
    print(json.dumps(dcf_results, indent=4))
else:
    print(f"DCF calculation failed for {target_ticker}.")

print("\n" + "="*40 + "\n") # Separating lines 






