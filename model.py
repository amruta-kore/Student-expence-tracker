import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

def predict_next_month_expense(expenses_data):
    """
    Predict next month's total expense based on historical monthly data.
    expenses_data format: [{'date': '2023-01-05', 'amount': 150}, ...]
    """
    if not expenses_data or len(expenses_data) < 2:
        return "Not enough data to predict. Add more expenses over different months!"
    
    df = pd.DataFrame(expenses_data)
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M')
    
    # Group by month and sum the amounts
    monthly_totals = df.groupby('month')['amount'].sum().reset_index()
    
    if len(monthly_totals) < 2:
        return "Need at least 2 months of data to make a prediction."
    
    # Prepare data for Linear Regression
    # X will be the month index (0, 1, 2, ...)
    X = np.arange(len(monthly_totals)).reshape(-1, 1)
    y = monthly_totals['amount'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict for the next month
    next_month_index = np.array([[len(monthly_totals)]])
    prediction = model.predict(next_month_index)[0]
    
    return max(0, round(prediction, 2)) # Ensure we don't return negative expense

def analyze_spending(expenses_data):
    """
    Provide simple AI-based (rule-based heuristic) suggestions based on category spending.
    """
    if not expenses_data:
        return ["No expenses recorded yet. Start adding expenses!"]
        
    df = pd.DataFrame(expenses_data)
    
    # Group by category
    category_totals = df.groupby('category')['amount'].sum().to_dict()
    total_spent = sum(category_totals.values())
    
    suggestions = []
    
    # Find the highest spending category
    highest_category = max(category_totals, key=category_totals.get)
    suggestions.append(f"Your highest expense is in **{highest_category}** (${category_totals[highest_category]:.2f}).")
    
    if highest_category == 'Food' and category_totals['Food'] > total_spent * 0.4:
        suggestions.append("Food expenses are quite high (>40% of total). Consider meal prepping or cooking at home to save money.")
        
    if 'Shopping' in category_totals and category_totals['Shopping'] > total_spent * 0.3:
        suggestions.append("You are spending a lot on shopping! Try a 'no-spend' week to boost your savings.")
        
    if 'Travel' in category_totals and category_totals['Travel'] > total_spent * 0.3:
        suggestions.append("Travel expenses are high. Consider student transit passes or carpooling.")
        
    if 'Education' in category_totals:
        suggestions.append("Good job investing in Education! These expenses usually pay off in the long run.")
        
    if total_spent == 0:
        return ["Add some expenses to get smart suggestions!"]
        
    return suggestions
