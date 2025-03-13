import gspread
from oauth2client.service_account import ServiceAccountCredentials
from bs4 import BeautifulSoup as bs
import pandas as pd
import pandas_ta as ta
import plotly.graph_objs as go
from plotly.subplots import make_subplots
import numpy as np
import streamlit as st
import base64

def process_data():
    # Define the scope of the access
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

    # Authenticate using the credentials JSON file
    creds = ServiceAccountCredentials.from_json_keyfile_name(r"C:\Users\mkslv\Desktop\Scritps\liquidity-435820-92a5f57b22d7.json", scope)
    client = gspread.authorize(creds)

    # Open Google Sheet and read data from the desired table
    spreadsheet_url = "https://docs.google.com/spreadsheets/d/1qsSWXPPsW25rOj_Y_PJJxBVr29kaJshb2jRavOvMt_w/edit?gid=0#gid=0"
    spreadsheet = client.open_by_url(spreadsheet_url)
    # Use the correct sheet name here
    worksheet = spreadsheet.worksheet('data')
    data = worksheet.get_all_records()
    df = pd.DataFrame(data)
    # Save Date column before setting index
    df['Date'] = pd.to_datetime(df['Date'])
    df.set_index('Date',inplace = True)    
    df = df[df.index >= '2011-01-01']    
    df['RSI'] = ta.rsi(df['BTC'],14)
    df['ROC'] = ta.roc(df['BTC'],90)
    # Optional: If you only want to calculate the rolling Z-score over a window (e.g., 90 periods):
    window = 100
    df['rolling_mean'] = df['ROC'].rolling(window).mean()
    df['rolling_std'] = df['ROC'].rolling(window).std()
    df['zScore'] = (df['ROC'] - df['rolling_mean']) / df['rolling_std']
    df['Signal'] = df['RSI'] * df['zScore']
    return df

def plot_data(df):
    with open(r"C:\Users\mkslv\Desktop\Scritps\\LOGO_50opa_cut02.png", "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode()
        
    # Create the subplots with better spacing
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.08,  # Increased spacing for cleaner separation
        row_heights=[0.6, 0.4]  # Adjusted ratio to emphasize price chart
    )
    
    # Create a copy of the price column to modify
    price = df['BTC'].values
    x_values = df.index
    
    # Identify color shifts based on ScoreAvg
    colors = np.where(df['Signal'] >= 0, '#009BB3', '#56FDA4') 
    
    # Add a smooth line for price first (as background)
    fig.add_trace(
        go.Scatter(
            x=x_values,
            y=price,
            mode='lines',
            line=dict(color='rgba(150,150,150,0.3)', width=1.5),
            showlegend=False
        ),
        row=1, col=1
    )
    
    # Iterate through segments to keep the line connected with color changes
    for i in range(len(x_values) - 1):
        fig.add_trace(
            go.Scatter(
                x=[x_values[i], x_values[i + 1]],
                y=[price[i], price[i + 1]],
                mode='lines',
                hovertemplate=None,
                hoverinfo='skip',
                line=dict(color=colors[i], width=2.5),  # Slightly thicker line
                showlegend=False
            ),
            row=1, col=1
        )
    


    # Improved oscillator
    trace_net = go.Bar(
        x=df.index,
        y=df['Signal'],
        name='Crowding',
        marker=dict(
            color=['rgba(0, 154, 154, 0.7)' if val >= 0 else 'rgba(86, 253, 164, 0.7)' for val in df['Signal']]
        ),
        marker_line=dict(
            color=['rgba(0, 154, 154, 1)' if val >= 0 else 'rgba(86, 253, 164, 1)' for val in df['Signal']],
            width=0.5
        )
    )
    
    # Add oscillator traces
    fig.add_trace(trace_net, row=2, col=1)
    
    # Add zero line for oscillator
    fig.add_shape(
        type="line",
        x0=df.index.min(),
        x1=df.index.max(),
        y0=0,
        y1=0,
        line=dict(color="rgba(120, 120, 120, 0.5)", width=1, dash="dash"),
        row=2, col=1
    )
    
    # Update layout with more professional design
    fig.update_layout(
        title={
            'text': 'Bitcoin Price & Crowding Index',
            'font': {'size': 24, 'family': 'Arial, sans-serif', 'color': '#333333'},
            'y': 0.97,
            'x': 0.5,
            'xanchor': 'center',
            'yanchor': 'top'
        },
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='center',
            x=0.5,
            font=dict(size=12),
            bgcolor='rgba(255, 255, 255, 0.7)',
            bordercolor='rgba(0, 0, 0, 0.1)',
            borderwidth=1
        ),
        width=1800,
        height=900,
        plot_bgcolor='rgba(250,250,250,0.9)',  # Light background instead of transparent
        paper_bgcolor='rgba(255,255,255,0.9)',
        margin=dict(l=80, r=80, t=100, b=80),  # Better margins
        font=dict(family='Arial, sans-serif', color='#333333'),  # Consistent font
        images=[
            go.layout.Image(
                source='data:image/png;base64,{}'.format(encoded_image),
                xref="paper",
                yref="paper",
                x=0.5,
                y=0.5,
                sizex=1.5,  # Reduced size for subtlety
                sizey=1.5,
                sizing="contain",
                opacity=0.15,  # More subtle watermark
                layer="below",
                xanchor="center",
                yanchor="middle",
            )
        ],
        hovermode='x unified'  # Better hover experience
    )
    
    # Update axes with improved styling
    fig.update_yaxes(
        title_text="Bitcoin Price",
        row=1, col=1, 
        type='log',
        showgrid=True,
        gridcolor='rgba(220, 220, 220, 0.5)',
        gridwidth=0.5,
        tickfont=dict(size=11),
        titlefont=dict(size=13),
        range = [np.log10(50), np.log10(120000)]
    )
    
    fig.update_yaxes(
        title_text="Crowding Index",
        row=2, col=1,
        showgrid=True,
        gridcolor='rgba(220, 220, 220, 0.5)',
        gridwidth=0.5,
        tickfont=dict(size=11),
        titlefont=dict(size=13),
        zeroline=True,
        zerolinecolor='rgba(0, 0, 0, 0.2)',
        zerolinewidth=1
    )
    
    fig.update_xaxes(
        title_text='',  # No title for top chart x-axis
        row=1, col=1, 
        showgrid=False,
        showticklabels=False,  # Hide top x-axis labels
        rangeslider_visible=False
    )
    
    fig.update_xaxes(
        title_text='',
        range=[pd.Timestamp('2013-05-01'), pd.Timestamp('2025-04-01')],
        row=2, col=1, 
        showgrid=True,
        gridcolor='rgba(220, 220, 220, 0.5)',
        gridwidth=0.5,
        tickfont=dict(size=11),
        titlefont=dict(size=13)
    )
    


    
    # Add chart credits at the bottom
    fig.add_annotation(
        xref='paper',
        yref='paper',
        x=0.01,
        y=0.01,
        text='Chart: Bitcoin Crowding Index | Data source: alphaextract.xyz',
        showarrow=False,
        font=dict(size=10, color='#888888'),
        align='left'
    )
    
    fig.show()
    # Show plot in Streamlit
    st.plotly_chart(fig, use_container_width=True)
    
    return fig

if __name__ == "__main__":
    df = process_data()
    if df is not None and not df.empty:
        plot_data(df)