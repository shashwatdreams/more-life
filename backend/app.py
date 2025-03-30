from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import openai
from dotenv import load_dotenv
import json
import pdfplumber
import tabula
import re
from typing import List, Dict, Any
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_transactions_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    transactions = []
    
    try:
        logger.info(f"Starting PDF processing for {pdf_path}")
        
        # First try to extract tables using tabula
        logger.info("Attempting to extract tables using tabula")
        try:
            tables = tabula.read_pdf(pdf_path, pages='all')
            logger.info(f"Found {len(tables)} tables in PDF")
        except Exception as e:
            logger.error(f"Tabula extraction failed: {str(e)}")
            tables = []
        
        for table in tables:
            try:
                # Clean up column names
                table.columns = [col.strip().lower() for col in table.columns]
                logger.debug(f"Table columns: {table.columns.tolist()}")
                
                # Try to identify date, description, and amount columns
                date_col = next((col for col in table.columns if 'date' in col), None)
                desc_col = next((col for col in table.columns if any(x in col for x in ['desc', 'memo', 'details'])), None)
                amount_col = next((col for col in table.columns if any(x in col for x in ['amount', 'debit', 'credit'])), None)
                
                logger.debug(f"Identified columns - Date: {date_col}, Description: {desc_col}, Amount: {amount_col}")
                
                if date_col and desc_col and amount_col:
                    for _, row in table.iterrows():
                        try:
                            date = pd.to_datetime(row[date_col])
                            description = str(row[desc_col])
                            amount_str = str(row[amount_col]).replace('$', '').replace(',', '')
                            amount = float(amount_str)
                            
                            transactions.append({
                                'Date': date,
                                'Description': description,
                                'Amount': amount
                            })
                        except Exception as e:
                            logger.warning(f"Error processing row: {e}")
                            continue
            except Exception as e:
                logger.error(f"Error processing table: {str(e)}")
                continue
        
        # If no transactions found, try text extraction
        if not transactions:
            logger.info("No transactions found in tables, attempting text extraction")
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page_num, page in enumerate(pdf.pages, 1):
                        try:
                            text = page.extract_text()
                            if text:
                                logger.debug(f"Extracted text from page {page_num} using pdfplumber")
                                transactions.extend(parse_text_for_transactions(text))
                        except Exception as e:
                            logger.warning(f"Error processing page {page_num} with pdfplumber: {e}")
                            continue
            except Exception as e:
                logger.error(f"pdfplumber extraction failed: {str(e)}")
        
        logger.info(f"Found {len(transactions)} transactions")
        return transactions
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        logger.error(traceback.format_exc())
        return []

def parse_text_for_transactions(text: str) -> List[Dict[str, Any]]:
    """Parse text to find transactions."""
    transactions = []
    lines = text.split('\n')
    
    for line in lines:
        # Look for date patterns (MM/DD/YYYY or MM-DD-YYYY)
        date_match = re.search(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', line)
        if date_match:
            try:
                date = pd.to_datetime(date_match.group(1))
                # Look for amount patterns ($XXX.XX)
                amount_match = re.search(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', line)
                if amount_match:
                    amount = float(amount_match.group(1).replace(',', ''))
                    # Get description (everything between date and amount)
                    desc_start = line.find(date_match.group(1)) + len(date_match.group(1))
                    desc_end = line.find(amount_match.group(0))
                    description = line[desc_start:desc_end].strip()
                    
                    transactions.append({
                        'Date': date,
                        'Description': description,
                        'Amount': amount
                    })
            except Exception as e:
                logger.warning(f"Error parsing line: {e}")
                continue
    
    return transactions

def get_ai_categorization(description: str, amount: float) -> str:
    try:
        prompt = f"""Categorize this financial transaction into one of these categories:
        - Income (for positive amounts)
        - Food & Dining
        - Transportation
        - Housing
        - Entertainment
        - Healthcare
        - Shopping
        - Utilities
        - Education
        - Travel
        - Other

        Transaction: {description}
        Amount: ${amount}

        Return only the category name, nothing else."""

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial transaction categorizer. Respond with only the category name."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=10
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error in AI categorization: {str(e)}")
        return "Other"

def get_spending_insights(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate AI-powered insights about spending patterns."""
    try:
        # Calculate high-ticket items (transactions above $500, excluding income)
        high_ticket_items = [t for t in transactions if abs(t['Amount']) > 500 and t['Category'] != 'Income']
        
        # Calculate monthly spending by category
        monthly_spending = {}
        for transaction in transactions:
            month = transaction['Date'].strftime('%Y-%m')
            category = transaction['Category']
            if month not in monthly_spending:
                monthly_spending[month] = {}
            if category not in monthly_spending[month]:
                monthly_spending[month][category] = 0
            monthly_spending[month][category] += abs(transaction['Amount'])
        
        # Generate insights using AI
        prompt = f"""Analyze these financial transactions and provide concise insights for a young adult in their twenties:

        High-ticket expenses (over $500):
        {[f"- ${abs(t['Amount'])}: {t['Description']} ({t['Category']})" for t in high_ticket_items]}

        Monthly spending by category:
        {json.dumps(monthly_spending, indent=2)}

        Provide a brief analysis in this format:
        ### Spending Overview
        [2-3 sentences about overall spending patterns]

        ### Key Areas
        - Top spending category and amount
        - Notable high-ticket expenses
        - Potential savings opportunities

        ### Quick Tips
        [2-3 actionable financial tips]

        Keep the response concise and focused on practical advice."""

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial advisor specializing in young adult financial literacy. Provide concise, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        insights = response.choices[0].message.content.strip()
        
        return {
            'high_ticket_items': high_ticket_items,
            'monthly_spending': monthly_spending,
            'insights': insights
        }
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        return {
            'high_ticket_items': [],
            'monthly_spending': {},
            'insights': "Unable to generate insights at this time."
        }

def process_file(filepath: str) -> pd.DataFrame:
    try:
        logger.info(f"Processing file: {filepath}")
        
        # Get file extension
        file_ext = os.path.splitext(filepath)[1].lower()
        logger.info(f"File extension: {file_ext}")
        
        if file_ext == '.pdf':
            logger.info("Processing PDF file")
            transactions = extract_transactions_from_pdf(filepath)
            if not transactions:
                raise ValueError("No transactions found in the PDF. Please ensure the statement contains transaction data.")
            df = pd.DataFrame(transactions)
            logger.info(f"Successfully extracted {len(df)} transactions from PDF")
        else:
            # Handle CSV and Excel files
            logger.info(f"Processing {file_ext} file")
            try:
                if file_ext == '.csv':
                    df = pd.read_csv(filepath)
                    logger.info(f"Successfully read CSV with {len(df)} rows")
                elif file_ext in ['.xlsx', '.xls']:
                    df = pd.read_excel(filepath)
                    logger.info(f"Successfully read Excel with {len(df)} rows")
                else:
                    raise ValueError(f"Unsupported file format: {file_ext}")
            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                raise ValueError(f"Error reading file: {str(e)}")

        # Log column names for debugging
        logger.info(f"Available columns: {df.columns.tolist()}")
        
        # Try to identify required columns if they don't exist
        if 'Description' not in df.columns:
            desc_cols = [col for col in df.columns if any(x in col.lower() for x in ['desc', 'memo', 'details', 'narrative'])]
            if desc_cols:
                df['Description'] = df[desc_cols[0]]
                logger.info(f"Using column '{desc_cols[0]}' as Description")
            else:
                raise ValueError("Could not find a description column. Please ensure your file has a column for transaction descriptions.")
        
        if 'Amount' not in df.columns:
            amount_cols = [col for col in df.columns if any(x in col.lower() for x in ['amount', 'debit', 'credit', 'value'])]
            if amount_cols:
                df['Amount'] = df[amount_cols[0]]
                logger.info(f"Using column '{amount_cols[0]}' as Amount")
            else:
                raise ValueError("Could not find an amount column. Please ensure your file has a column for transaction amounts.")
        
        if 'Date' not in df.columns:
            date_cols = [col for col in df.columns if any(x in col.lower() for x in ['date', 'posted', 'transaction date'])]
            if date_cols:
                df['Date'] = df[date_cols[0]]
                logger.info(f"Using column '{date_cols[0]}' as Date")
            else:
                raise ValueError("Could not find a date column. Please ensure your file has a column for transaction dates.")

        # Clean up the data
        try:
            # Convert Date column to datetime
            df['Date'] = pd.to_datetime(df['Date'])
            logger.info("Successfully converted Date column to datetime")
            
            # Clean Amount column
            df['Amount'] = df['Amount'].astype(str).str.replace('$', '').str.replace(',', '')
            df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce')
            logger.info("Successfully cleaned Amount column")
            
            # Clean Description column
            df['Description'] = df['Description'].astype(str).str.strip()
            logger.info("Successfully cleaned Description column")
            
            # Remove any rows with missing values
            df = df.dropna(subset=['Date', 'Description', 'Amount'])
            logger.info(f"Removed rows with missing values. Remaining rows: {len(df)}")
            
            if len(df) == 0:
                raise ValueError("No valid transactions found after cleaning the data.")
            
        except Exception as e:
            logger.error(f"Error cleaning data: {str(e)}")
            raise ValueError(f"Error cleaning data: {str(e)}")
        
        # Add AI categorization
        logger.info("Starting AI categorization")
        df['Category'] = df.apply(lambda x: get_ai_categorization(x['Description'], x['Amount']), axis=1)
        logger.info("Completed AI categorization")
        
        return df
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@app.route('/api/upload', methods=['POST'])
def upload_files():
    if 'files' not in request.files:
        return jsonify({'error': 'Please select at least one file to upload'}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({'error': 'Please select at least one file to upload'}), 400
    
    all_data = []
    processed_files = []
    failed_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            try:
                # Save the file
                file.save(filepath)
                logger.info(f"Saved file: {filename}")
                
                # Process the file
                logger.info(f"Processing file: {filename}")
                df = process_file(filepath)
                
                if df is not None and not df.empty:
                    all_data.append(df)
                    processed_files.append(filename)
                    logger.info(f"Successfully processed {filename} with {len(df)} transactions")
                else:
                    raise ValueError("No data found in file")
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error processing {filename}: {error_msg}")
                failed_files.append({
                    'filename': filename,
                    'error': error_msg
                })
            finally:
                # Clean up the uploaded file
                try:
                    os.remove(filepath)
                    logger.info(f"Cleaned up file: {filename}")
                except Exception as e:
                    logger.error(f"Error cleaning up file {filename}: {str(e)}")
    
    if not all_data:
        return jsonify({
            'error': 'Unable to process any files. Please check the error messages below for each file.',
            'failed_files': failed_files
        }), 400
    
    # Combine all dataframes
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Category breakdown
    category_data = combined_df[combined_df['Amount'] < 0].groupby('Category')['Amount'].sum().reset_index()
    category_data['Amount'] = category_data['Amount'].abs()
    
    # Create visualizations
    fig_categories = px.pie(category_data, values='Amount', names='Category', title='Expenses by Category')
    
    # Get detailed transaction data by category
    transactions_by_category = {}
    for category in category_data['Category'].unique():
        category_transactions = combined_df[
            (combined_df['Category'] == category) & 
            (combined_df['Amount'] < 0)
        ].sort_values('Date', ascending=False)
        transactions_by_category[category] = category_transactions.to_dict('records')
    
    # Generate spending insights
    insights_data = get_spending_insights(combined_df.to_dict('records'))
    
    return jsonify({
        'category_data': category_data.to_dict('records'),
        'category_plot': fig_categories.to_json(),
        'transactions_by_category': transactions_by_category,
        'insights': insights_data,
        'processed_files': processed_files,
        'failed_files': failed_files
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message')
        context = data.get('context')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        prompt = f"""You are a financial advisor specializing in young adult financial literacy. 
        Use the following financial insights as context for your response:

        {context}

        User question: {message}

        Provide a concise, practical response focused on financial advice for young adults."""

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial advisor specializing in young adult financial literacy. Provide concise, actionable advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        return jsonify({
            'response': response.choices[0].message.content.strip()
        })
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Failed to process chat message'}), 500

@app.route('/api/analyze-goals', methods=['POST'])
def analyze_goals():
    try:
        data = request.json
        monthly_income = data.get('monthlyIncome')
        budget_goals = data.get('budgetGoals', {})
        custom_goals = data.get('customGoals', [])
        actual_spending = data.get('actualSpending')

        # Prepare analysis context
        analysis_context = {
            "monthly_income": monthly_income,
            "budget_goals": budget_goals,
            "custom_goals": custom_goals
        }

        if actual_spending:
            analysis_context["actual_spending"] = {
                "categories": actual_spending["categoryData"],
                "monthly_trend": actual_spending["monthlyData"],
                "current_insights": actual_spending["insights"]
            }

        # Generate AI analysis and recommendations
        prompt = f"""As a financial advisor, analyze this person's financial goals and provide personalized recommendations:

Monthly Income: ${monthly_income}

Desired Budget Allocation:
{json.dumps(budget_goals, indent=2)}

Personal Financial Goals:
{json.dumps(custom_goals, indent=2)}

{f'''
Current Spending Patterns:
{json.dumps(actual_spending, indent=2)}
''' if actual_spending else 'No current spending data available.'}

Provide analysis in this format:
1. Budget Analysis
   - Compare desired allocation with recommended percentages
   - If actual spending data exists, compare with current habits
   - Identify potential issues or unrealistic goals

2. Custom Goals Assessment
   - Evaluate feasibility of personal financial goals
   - Suggest timeline adjustments if needed
   - Recommend specific saving strategies

3. Action Items
   - List 3-5 specific, actionable steps
   - Include both immediate actions and long-term strategies
   - If actual spending data exists, focus on areas needing most improvement

Keep the response practical and focused on achievable improvements."""

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial advisor specializing in personal finance and budgeting for young adults. Provide practical, actionable advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        recommendations = response.choices[0].message.content.strip()

        return jsonify({
            'recommendations': recommendations,
            'analysis': {
                'monthly_income': monthly_income,
                'budget_goals': budget_goals,
                'custom_goals': custom_goals,
                'has_actual_data': bool(actual_spending)
            }
        })

    except Exception as e:
        logger.error(f"Error analyzing goals: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Failed to analyze goals'}), 500

if __name__ == '__main__':
    app.run(debug=True) 