const API_BASE = 'http://localhost:3001/api';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authSection = document.getElementById('authSection');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const guestMode = localStorage.getItem('guestMode');
    
    if (token || guestMode) {
        showDashboard();
        if (token) {
            loadDashboardData();
        } else {
            loadGuestData();
        }
    } else {
        showAuth();
    }
}

// Load guest data (mock data)
function loadGuestData() {
    document.getElementById('todayCalories').textContent = '1850';
    document.getElementById('todaySteps').textContent = '8500';
    document.getElementById('todayWater').textContent = '2.1';
    document.getElementById('todaySleep').textContent = '7.5';
}

// Show/Hide sections
function showAuth() {
    authSection.style.display = 'block';
    dashboard.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    registerBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
}

function showDashboard() {
    authSection.style.display = 'none';
    dashboard.style.display = 'block';
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
}

// Tab functionality
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        const tabName = e.target.dataset.tab;
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        e.target.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Load specific tab data
        if (tabName === 'meal-plan') loadMealPlan();
        if (tabName === 'analytics') loadAnalytics();
    }
});

// Switch between login and register forms
loginBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

registerBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
});

// Handle login
loginForm.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            showMessage('Login successful!', 'success');
            setTimeout(() => {
                showDashboard();
                loadDashboardData();
            }, 1000);
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

// Handle register
registerForm.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const healthData = {
        age: parseInt(document.getElementById('age').value),
        weight: parseFloat(document.getElementById('weight').value),
        height: parseFloat(document.getElementById('height').value),
        gender: document.getElementById('gender').value,
        activityLevel: document.getElementById('activityLevel').value,
        goals: ['weight_loss'] // Default goal
    };
    
    const userData = {
        username: document.getElementById('registerUsername').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        healthData
    };
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(() => {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
            }, 1000);
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
});

// Handle logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('guestMode');
    showAuth();
    showMessage('Logged out successfully!', 'success');
});

// Handle guest access
document.getElementById('guestBtn').addEventListener('click', () => {
    localStorage.setItem('guestMode', 'true');
    showDashboard();
    loadGuestData();
    showMessage('Welcome, Guest! Data won\'t be saved.', 'success');
});

// Daily Log functionality
document.getElementById('saveLog').addEventListener('click', async () => {
    const guestMode = localStorage.getItem('guestMode');
    
    if (guestMode) {
        showMessage('Guest mode: Data not saved', 'error');
        return;
    }
    
    const logData = {
        calories: parseInt(document.getElementById('logCalories').value) || 0,
        steps: parseInt(document.getElementById('logSteps').value) || 0,
        waterIntake: parseFloat(document.getElementById('logWater').value) || 0,
        sleepHours: parseFloat(document.getElementById('logSleep').value) || 0
    };
    
    try {
        const response = await fetch(`${API_BASE}/logs/daily`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(logData)
        });
        
        if (response.ok) {
            showMessage('Log saved successfully!', 'success');
            loadDashboardData();
            // Clear form
            document.querySelectorAll('#daily-log input').forEach(input => input.value = '');
        }
    } catch (error) {
        showMessage('Failed to save log', 'error');
    }
});

// Add meal functionality
document.getElementById('addMeal').addEventListener('click', async () => {
    const mealData = {
        meals: [{
            name: document.getElementById('mealName').value,
            calories: parseInt(document.getElementById('mealCalories').value) || 0,
            carbs: parseFloat(document.getElementById('mealCarbs').value) || 0,
            protein: parseFloat(document.getElementById('mealProtein').value) || 0,
            fat: parseFloat(document.getElementById('mealFat').value) || 0,
            time: document.getElementById('mealTime').value
        }]
    };
    
    try {
        const response = await fetch(`${API_BASE}/logs/daily`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(mealData)
        });
        
        if (response.ok) {
            showMessage('Meal added successfully!', 'success');
            // Clear form
            document.querySelectorAll('.meals-section input').forEach(input => input.value = '');
        }
    } catch (error) {
        showMessage('Failed to add meal', 'error');
    }
});

// Load dashboard data
async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE}/logs/${today}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.log) {
            document.getElementById('todayCalories').textContent = data.log.calories || 0;
            document.getElementById('todaySteps').textContent = data.log.steps || 0;
            document.getElementById('todayWater').textContent = data.log.waterIntake || 0;
            document.getElementById('todaySleep').textContent = data.log.sleepHours || 0;
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

// Load meal plan
async function loadMealPlan() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE}/meal-plans/${today}`);
        const data = await response.json();
        const mealPlanContent = document.getElementById('mealPlanContent');
        
        if (data.mealPlan) {
            mealPlanContent.innerHTML = data.mealPlan.map(meal => `
                <div class="meal-card">
                    <h4>${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</h4>
                    <h5>${meal.name}</h5>
                    <p><strong>Ingredients:</strong> ${meal.ingredients.join(', ')}</p>
                    <div class="nutrition">
                        <span>Calories: ${meal.nutrition.calories}</span>
                        <span>Carbs: ${meal.nutrition.carbs}g</span>
                        <span>Protein: ${meal.nutrition.protein}g</span>
                        <span>Fat: ${meal.nutrition.fat}g</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load meal plan:', error);
        document.getElementById('mealPlanContent').innerHTML = '<p>Failed to load meal plan. Please try again.</p>';
    }
}

// Generate new meal plan
document.getElementById('generateMealPlan').addEventListener('click', loadMealPlan);

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/weekly`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        const chartContainer = document.getElementById('analyticsChart');
        
        if (data.weeklyData) {
            chartContainer.innerHTML = `
                <div class="analytics-grid">
                    ${data.weeklyData.map(day => `
                        <div class="day-stats">
                            <h4>${new Date(day.date).toLocaleDateString()}</h4>
                            <p>Calories: ${day.calories}</p>
                            <p>Steps: ${day.steps}</p>
                            <p>Water: ${day.water}L</p>
                            <p>Sleep: ${day.sleep}h</p>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

// AI Chat functionality
document.getElementById('sendMessage').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    
    // Add user message
    chatMessages.innerHTML += `<div class="message user">You: ${message}</div>`;
    input.value = '';
    
    try {
        const response = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Add AI response
            chatMessages.innerHTML += `<div class="message ai">AI: ${data.response}</div>`;
        } else {
            chatMessages.innerHTML += `<div class="message error">Error: ${data.error}</div>`;
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        chatMessages.innerHTML += `<div class="message error">Error: Failed to get AI response</div>`;
    }
}

// Show messages
function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const activeForm = loginForm.style.display !== 'none' ? loginForm : registerForm;
    activeForm.appendChild(messageDiv);
    
    setTimeout(() => messageDiv.remove(), 3000);
}

// Initialize app
checkAuth();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}