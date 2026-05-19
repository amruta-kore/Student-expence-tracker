// ====== Application State ======
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let pieChartInstance = null;
let barChartInstance = null;

const FLASK_API_URL = 'http://localhost:5000/api';

// ====== DOM Elements ======
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const totalExpenseEl = document.getElementById('total-expense');
const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const budgetAlert = document.getElementById('budget-alert');
const downloadBtn = document.getElementById('download-btn');

const predictBtn = document.getElementById('predict-btn');
const aiPredictionEl = document.getElementById('ai-prediction');
const analyzeBtn = document.getElementById('analyze-btn');
const aiSuggestionsEl = document.getElementById('ai-suggestions');

// ====== Initialization ======
function init() {
    budgetInput.value = budget > 0 ? budget : '';
    renderExpenses();
    updateDashboard();
}

// ====== Event Listeners ======
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    const expense = {
        id: Date.now().toString(),
        title,
        amount,
        category,
        date
    };

    expenses.push(expense);
    saveExpenses();
    
    expenseForm.reset();
    document.getElementById('date').valueAsDate = new Date(); // Reset to today
    
    renderExpenses();
    updateDashboard();
});

setBudgetBtn.addEventListener('click', () => {
    budget = parseFloat(budgetInput.value) || 0;
    localStorage.setItem('budget', budget);
    updateDashboard();
    alert('Budget saved!');
});

downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    downloadCSV();
});

// ====== AI Backend Integration ======
predictBtn.addEventListener('click', async () => {
    if (expenses.length === 0) {
        aiPredictionEl.textContent = "No data yet.";
        return;
    }
    
    aiPredictionEl.textContent = "Calculating...";
    
    try {
        const response = await fetch(`${FLASK_API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expenses })
        });
        
        const data = await response.json();
        
        if (typeof data.prediction === 'number') {
            aiPredictionEl.textContent = `$${data.prediction.toFixed(2)}`;
        } else {
            // It returned a message string
            aiPredictionEl.innerHTML = `<span style="font-size: 1rem;">${data.prediction}</span>`;
        }
    } catch (error) {
        console.error("Error calling AI backend:", error);
        aiPredictionEl.innerHTML = `<span style="font-size: 1rem; color: var(--danger-color);">Backend not running. Start app.py</span>`;
    }
});

analyzeBtn.addEventListener('click', async () => {
    aiSuggestionsEl.innerHTML = "<p>Analyzing your spending patterns...</p>";
    
    try {
        const response = await fetch(`${FLASK_API_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expenses })
        });
        
        const data = await response.json();
        const suggestions = data.suggestions;
        
        let html = "<ul>";
        suggestions.forEach(s => {
            html += `<li>${s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`;
        });
        html += "</ul>";
        
        aiSuggestionsEl.innerHTML = html;
    } catch (error) {
        console.error("Error calling AI backend:", error);
        aiSuggestionsEl.innerHTML = `<p style="color: var(--danger-color);">Cannot connect to Python backend. Please ensure app.py is running.</p>`;
    }
});

// ====== Core Functions ======
window.deleteExpense = function(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
    updateDashboard();
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function renderExpenses() {
    expenseList.innerHTML = '';
    
    // Sort by date descending
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.title}</td>
            <td><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 12px; font-size: 0.85rem; color: #475569;">${expense.category}</span></td>
            <td>$${expense.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteExpense('${expense.id}')"><i class="fa-solid fa-trash"></i></button></td>
        `;
        expenseList.appendChild(tr);
    });
}

function updateDashboard() {
    // Calculate total
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    totalExpenseEl.textContent = `$${total.toFixed(2)}`;
    
    // Check Budget
    if (budget > 0 && total > budget) {
        budgetAlert.classList.remove('hidden');
    } else {
        budgetAlert.classList.add('hidden');
    }

    updateCharts();
}

// ====== Chart.js Logic ======
function updateCharts() {
    // Prepare Category Data for Pie Chart
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const pieLabels = Object.keys(categoryTotals);
    const pieData = Object.values(categoryTotals);
    const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (pieChartInstance) pieChartInstance.destroy();
    
    const ctxPie = document.getElementById('categoryPieChart').getContext('2d');
    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: pieLabels.length ? pieLabels : ['No Data'],
            datasets: [{
                data: pieData.length ? pieData : [1],
                backgroundColor: pieData.length ? pieColors : ['#e2e8f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Prepare Monthly Data for Bar Chart
    const monthlyTotals = {};
    expenses.forEach(e => {
        const monthYear = e.date.substring(0, 7); // "YYYY-MM"
        monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + e.amount;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const barData = sortedMonths.map(m => monthlyTotals[m]);

    if (barChartInstance) barChartInstance.destroy();

    const ctxBar = document.getElementById('monthlyBarChart').getContext('2d');
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: sortedMonths.length ? sortedMonths : ['No Data'],
            datasets: [{
                label: 'Monthly Spending',
                data: barData.length ? barData : [0],
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ====== Export to CSV ======
function downloadCSV() {
    if (expenses.length === 0) {
        alert("No expenses to download.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Date,Title,Category,Amount\n"; // Header row
    
    expenses.forEach(e => {
        let row = `"${e.id}","${e.date}","${e.title}","${e.category}",${e.amount}`;
        csvContent += row + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Set default date to today in form
document.getElementById('date').valueAsDate = new Date();

// Start App
init();
