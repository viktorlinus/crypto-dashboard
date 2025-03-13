import json
from indicators.funding_indicator import FundingIndicator, supabase

def save_to_supabase():
    """Manually generate and save indicator data to Supabase"""
    indicator = FundingIndicator()
    
    # ✅ Get all available data
    result = indicator.generate_data({"period": "all", "theme": "light"})  

    # ✅ Convert JSON string to a Python dictionary
    plotly_json = json.loads(result["plotly_json"])  # ✅ Fix this!

    # ✅ Insert the correct JSON format
    data = {
        "indicator_name": "funding_rate",
        "plotly_json": plotly_json,  # ✅ Now stored as a valid JSON object
        "latest_data": result["latest_data"]  # ✅ Already a dictionary
    }

    response = supabase.table("indicators").insert(data).execute()
    print("✅ Saved to Supabase:", response)

# Run manually if script is executed
if __name__ == "__main__":
    save_to_supabase()
