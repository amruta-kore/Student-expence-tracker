from flask import Flask, request, jsonify
from flask_cors import CORS
import model

app = Flask(__name__)
CORS(app) # Allow frontend to communicate with backend running on a different port

@app.route('/api/predict', methods=['POST'])
def predict():
    """Endpoint to predict next month's expenses"""
    data = request.json
    expenses = data.get('expenses', [])
    prediction = model.predict_next_month_expense(expenses)
    return jsonify({"prediction": prediction})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Endpoint to get smart spending suggestions"""
    data = request.json
    expenses = data.get('expenses', [])
    suggestions = model.analyze_spending(expenses)
    return jsonify({"suggestions": suggestions})

if __name__ == '__main__':
    print("Starting AI Student Expense Tracker Backend...")
    app.run(debug=True, port=5000)
