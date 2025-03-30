# More Life - Financial Analysis App

"Less Stress, More Life" - A modern web application that helps you analyze your financial data through intuitive visualizations and categorization.

## Features

- Upload bank statements (PDF, CSV)
- Automatic expense categorization
- Interactive financial graphs and charts
- Income vs. Expenses analysis
- Category-wise spending breakdown

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python backend/app.py
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Tech Stack

- Backend: Python (Flask)
- Frontend: React
- Data Processing: Pandas, NumPy
- Visualization: Plotly
- File Processing: Werkzeug

## License

MIT License 