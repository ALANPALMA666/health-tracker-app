// File: frontend/app.js
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize API service
    const api = new HealthAPI();
    
    // Check authentication
    const token = localStorage.getItem('health_token');
    if (!token) {
        // Redirect to login or show login modal
        showLoginModal();
        return;
    }
    
    try {
        // Load user data
        const userData = await api.getUserProfile();
        updateUIWithUserData(userData);
        
        // Load today's data
        const today = new Date().toISOString().split('T')[0];
        const dailyLog = await api.getDailyLog(today);
        const mealPlan = await api.getMealPlan(today);
        const analytics = await api.getWeeklyAnalytics();
        
        updateDashboard(dailyLog, mealPlan, analytics);
        
        // Set up real-time updates
        setupRealTimeUpdates();
        
    } catch (error) {
        console.error('Failed to load data:', error);
        // Handle error (show message, redirect to login, etc.)
    }
});

// Update UI with user data
function updateUIWithUserData(userData) {
    document.querySelector('.user-avatar').textContent = 
        userData.user.username.substring(0, 2).toUpperCase();
    document.querySelector('.user-info h3').textContent = userData.user.username;
    
    // Calculate health score based on recent data
    const healthScore = calculateHealthScore(userData.user.dailyLogs);
    document.querySelector('.user-info strong').textContent = `${healthScore}/100`;
}

// Update dashboard with fetched data
function updateDashboard(dailyLog, mealPlan, analytics) {
    // Update health stats
    if (dailyLog.log) {
        document.querySelector('.stat-value:nth-child(1)').textContent = 
            dailyLog.log.calories?.toLocaleString() || '0';
        document.querySelector('.stat-value:nth-child(2)').textContent = 
            Math.floor(dailyLog.log.steps / 1000) + 'k' || '0';
        document.querySelector('.stat-value:nth-child(3)').textContent = 
            `${dailyLog.log.waterIntake || 0}/8 glasses`;
        document.querySelector('.stat-value:nth-child(4)').textContent = 
            dailyLog.log.sleepQuality || '0%';
    }
    
    // Update meal planner
    if (mealPlan.mealPlan) {
        updateMealList(mealPlan.mealPlan);
    }
    
    // Update activity chart
    if (analytics.weeklyData) {
        updateActivityChart(analytics.weeklyData);
    }
}

// Update meal list with API data
function updateMealList(meals) {
    const mealList = document.querySelector('.meal-list');
    mealList.innerHTML = '';
    
    meals.forEach(meal => {
        const mealItem = document.createElement('div');
        mealItem.className = 'meal-item';
        mealItem.innerHTML = `
            <div class="meal-icon">
                <i class="fas fa-${getMealIcon(meal.type)}"></i>
            </div>
            <div class="meal-details">
                <h4>${meal.name}</h4>
                <div class="meal-macros">
                    <span>Carbs: ${meal.nutrition.carbs}g</span>
                    <span>Protein: ${meal.nutrition.protein}g</span>
                    <span>Fat: ${meal.nutrition.fat}g</span>
                </div>
            </div>
            <div class="meal-calories">${meal.nutrition.calories} kcal</div>
        `;
        mealList.appendChild(mealItem);
    });
}

// Update activity chart
function updateActivityChart(weeklyData) {
    const labels = weeklyData.map(day => 
        new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
    );
    const steps = weeklyData.map(day => day.steps || 0);
    const activeMinutes = weeklyData.map(day => Math.floor((day.steps || 0) / 100));
    
    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = steps;
    activityChart.data.datasets[1].data = activeMinutes;
    activityChart.update();
}

// AI Assistant integration
async function askAI(message) {
    try {
        const response = await api.chatWithAI(message);
        document.querySelector('.ai-message p').textContent = response.response;
        
        // Add to chat history
        addToChatHistory('user', message);
        addToChatHistory('ai', response.response);
        
    } catch (error) {
        console.error('AI chat failed:', error);
        document.querySelector('.ai-message p').textContent = 
            "Sorry, I'm having trouble connecting. Please try again.";
    }
}

// Log water intake
async function logWaterIntake(glasses) {
    try {
        await api.logDailyData({
            waterIntake: glasses,
            date: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Failed to log water:', error);
    }
}

// Log meal
async function logMeal(mealData) {
    try {
        const today = new Date().toISOString().split('T')[0];
        const currentLog = await api.getDailyLog(today);
        
        const updatedLog = {
            ...currentLog.log,
            meals: [...(currentLog.log?.meals || []), mealData],
            calories: (currentLog.log?.calories || 0) + mealData.calories
        };
        
        await api.logDailyData(updatedLog);
        
        // Update UI
        updateHealthScore();
        
    } catch (error) {
        console.error('Failed to log meal:', error);
    }
}

// Setup real-time updates (using WebSockets or polling)
function setupRealTimeUpdates() {
    // WebSocket connection
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'HEALTH_UPDATE':
                updateRealTimeStats(data.payload);
                break;
            case 'AI_RECOMMENDATION':
                showAIRecommendation(data.payload);
                break;
            case 'GOAL_COMPLETED':
                showGoalCompleted(data.payload);
                break;
        }
    };
    
    // Fallback to polling if WebSockets fail
    setInterval(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const updates = await api.getDailyLog(today);
            updateRealTimeStats(updates.log);
        } catch (error) {
            console.error('Polling failed:', error);
        }
    }, 30000); // Every 30 seconds
}

// Helper functions
function getMealIcon(mealType) {
    const icons = {
        breakfast: 'egg',
        lunch: 'utensils',
        dinner: 'drumstick-bite',
        snack: 'apple-alt'
    };
    return icons[mealType] || 'utensils';
}

function calculateHealthScore(logs) {
    if (!logs || logs.length === 0) return 75;
    
    const recentLog = logs[logs.length - 1];
    let score = 75;
    
    // Calculate based on various factors
    if (recentLog.waterIntake >= 8) score += 5;
    if (recentLog.calories >= 1800 && recentLog.calories <= 2200) score += 10;
    if (recentLog.steps >= 10000) score += 10;
    if (recentLog.sleepHours >= 7) score += 5;
    
    return Math.min(score, 100);
}

// Login Modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Welcome to Daily Healthy Optimizer</h2>
            <form id="loginForm">
                <input type="email" placeholder="Email" required>
                <input type="password" placeholder="Password" required>
                <button type="submit">Login</button>
                <p>Don't have an account? <a href="#" id="showRegister">Register</a></p>
            </form>
            <form id="registerForm" style="display: none;">
                <input type="text" placeholder="Username" required>
                <input type="email" placeholder="Email" required>
                <input type="password" placeholder="Password" required>
                <button type="submit">Register</button>
                <p>Already have an account? <a href="#" id="showLogin">Login</a></p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add CSS for modal
    const style = document.createElement('style');
    style.textContent = `
        .login-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            padding: 40px;
            border-radius: 20px;
            width: 90%;
            max-width: 400px;
        }
        .modal-content input {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 16px;
        }
        .modal-content button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #10B981, #3B82F6);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
}