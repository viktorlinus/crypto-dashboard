# Funding Indicator Daily Update

This document explains the automatic daily update process for the Bitcoin Funding Rate Indicator.

## Overview

The funding indicator data is updated daily at 2 AM UTC using GitHub Actions. The process:

1. Fetches the latest Bitcoin price and funding rate data from Google Sheets
2. Calculates the indicator metrics and signals (bull buy, bear buy, sell, weak sell)
3. Generates a Plotly visualization chart
4. Updates the data in Supabase for the dashboard to access

## How It Works

### Automation with GitHub Actions

The process runs as a GitHub Actions workflow scheduled to run daily at 2 AM UTC. You can find the workflow configuration in:

```
.github/workflows/funding-indicator-update.yml
```

### Data Collection and Processing

The update process:

1. Uses `save_to_supabase.py` to trigger the update
2. Calls the `FundingIndicator` class from the indicators module
3. Fetches data using Google Sheets API (requires credentials)
4. Processes the data to generate signals
5. Creates a Plotly visualization
6. Uploads the result to Supabase

## Required Secrets

For the GitHub Actions workflow to run properly, the following repository secrets must be configured:

1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
3. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (with write access)
4. `FUNDING_CREDENTIALS_JSON` - The full contents of the Google service account credentials file (`funding-435016-442a60c70683.json`)

## Setting Up the GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret" and add each of the required secrets

### Creating the FUNDING_CREDENTIALS_JSON Secret

The `FUNDING_CREDENTIALS_JSON` secret should contain the entire JSON contents of the service account credentials file. To add it:

1. Open the `funding-435016-442a60c70683.json` file
2. Copy the entire contents
3. Create a new repository secret named `FUNDING_CREDENTIALS_JSON`
4. Paste the JSON contents into the value field

## Manual Triggering

You can also manually trigger the update process:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Daily Funding Indicator Update" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Troubleshooting

If the workflow fails, check the following:

1. Verify that all required secrets are correctly configured
2. Check the GitHub Actions logs for detailed error messages
3. Ensure the Google Sheets API credentials are valid and have access to the spreadsheet
4. Confirm that the Supabase credentials have proper write permissions

## Local Testing

You can test the update process locally by running:

```bash
python save_to_supabase.py
```

Make sure you have all required environment variables set in your `.env.local` file and the Google service account credentials file is in the root directory.
