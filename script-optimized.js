const API = 'http://localhost:3001/api';

// Cache DOM elements
const elements = {
    todayCalories: document.getElementById('todayCalories'),
    todaySteps: document.getElementById('todaySteps'),
    todayWater: document.getElementById('todayWater'),
    todaySleep: document.getElementById('todaySleep'),
    todayScore: document.getElementById('todayScore'),
    chatInput: document.getElementById('chatInput'),
    sendMessage: document.getElementById('sendMessage'),
    aiResponse: document.getElementById('aiResponse'),
    mealPlanContent: document.getElementById('mealPlanContent'),
    generateMealPlan: document.getElementById('generateMealPlan'),
    logMeal: document.getElementById('logMeal'),
    addWorkout: document.getElementById('addWorkout'),
    logWater: document.getElementById('logWater'),
    logSleep: document.getElementById('logSleep')
};

// API utilities
const api = {
    async post(endpoint, data, auth = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
        
        return fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
    },
    
    async get(endpoint, auth = false) {
        const headers = {};
        if (auth) headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
        
        return fetch(`${API}${endpoint}`, { headers });
    }
};

// Data management
const data = {
    async load() {
        if (localStorage.getItem('guestMode')) {
            this.loadGuest();
        } else {
            await this.loadUser();
        }
    },
    
    loadGuest() {
        elements.todayCalories.textContent = '1,850';
        elements.todaySteps.textContent = '8,500';
        elements.todayWater.textContent = '2.1';
        elements.todaySleep.textContent = '7.5';
        elements.todayScore.textContent = '87';
    },
    
    async loadUser() {
        const today = new Date().toISOString().split('T')[0];
        try {
            const res = await api.get(`/logs/${today}`, true);
            const data = await res.json();
            
            if (data.log) {
                elements.todayCalories.textContent = data.log.calories || 0;
                elements.todaySteps.textContent = data.log.steps || 0;
                elements.todayWater.textContent = data.log.waterIntake || 0;
                elements.todaySleep.textContent = data.log.sleepHours || 0;
            }
        } catch (error) {
            console.error('Failed to load data');
            this.loadGuest();
        }
    }
};

// AI Chat functionality
const aiChat = {
    async sendMessage() {
        const message = elements.chatInput.value.trim();
        if (!message) return;
        
        // Show thinking state
        elements.aiResponse.style.opacity = '0.5';
        elements.aiResponse.textContent = 'Thinking...';
        elements.chatInput.value = '';
        
        try {
            const res = await api.post('/ai/chat', { message });
            const data = await res.json();
            
            setTimeout(() => {
                elements.aiResponse.textContent = data.response || this.getLocalResponse(message);
                elements.aiResponse.style.opacity = '1';
                
                // Animation
                elements.aiResponse.parentElement.style.animation = 'slideUp 0.3s ease';
            }, 800);
            
        } catch (error) {
            setTimeout(() => {
                elements.aiResponse.textContent = this.getLocalResponse(message);
                elements.aiResponse.style.opacity = '1';
            }, 800);
        }
    },
    
    getLocalResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        const responses = {
            'meal': "I recommend a balanced meal with lean protein, complex carbs, and healthy fats. Try grilled chicken with quinoa and roasted vegetables!",
            'breakfast': "Great choice! For breakfast, try protein oatmeal with berries or avocado toast with eggs. Both provide sustained energy.",
            'exercise': "Aim for 30 minutes of moderate activity daily. Mix cardio with strength training for best results.",
            'sleep': "Try to get 7-9 hours of quality sleep. Establish a relaxing bedtime routine and avoid screens before bed.",
            'water': "Drink at least 8 glasses of water daily. Carry a water bottle and sip throughout the day.",
            'hello': "Hello! I'm your health AI assistant. How can I help you with your wellness goals today?",
            'help': "I can help with meal planning, exercise suggestions, sleep tips, hydration tracking, and health advice. What do you need help with?"
        };
        
        for (const [keyword, response] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }
        
        const defaultResponses = [
            "I'm here to help with your health goals! Could you tell me more about what you're looking for?",
            "That's a great question! For personalized advice, I need to know more about your specific goals.",
            "I specialize in nutrition and fitness advice. What specific area would you like help with today?"
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
};

// Meal Plan functionality
const mealPlan = {
    async generate() {
        try {
            const res = await api.get('/meal-plans/today');
            const data = await res.json();
            
            if (data.success && data.mealPlan) {
                this.display(data.mealPlan);
            } else {
                this.displayLocal();
            }
        } catch (error) {
            this.displayLocal();
        }
    },
    
    display(meals) {
        elements.mealPlanContent.innerHTML = meals.map(meal => `
            <div class="meal-item">
                <div class="meal-icon">
                    <i class="fas fa-${this.getIcon(meal.type)}"></i>
                </div>
                <div class="meal-details">
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-macros">
                        <div class="macro-item">
                            <span class="macro-dot macro-carbs"></span>
                            <span>${meal.nutrition.carbs}g carbs</span>
                        </div>
                        <div class="macro-item">
                            <span class="macro-dot macro-protein"></span>
                            <span>${meal.nutrition.protein}g protein</span>
                        </div>
                        <div class="macro-item">
                            <span class="macro-dot macro-fat"></span>
                            <span>${meal.nutrition.fat}g fat</span>
                        </div>
                    </div>
                </div>
                <div class="meal-calories">${meal.nutrition.calories} kcal</div>
            </div>
        `).join('');
    },
    
    displayLocal() {
        const localMeals = [
            {
                type: 'breakfast',
                name: 'Protein Oatmeal Bowl',
                nutrition: { calories: 350, carbs: 45, protein: 25, fat: 8 }
            },
            {
                type: 'lunch',
                name: 'Grilled Chicken Salad',
                nutrition: { calories: 450, carbs: 20, protein: 35, fat: 22 }
            },
            {
                type: 'dinner',
                name: 'Salmon & Vegetables',
                nutrition: { calories: 500, carbs: 40, protein: 30, fat: 25 }
            }
        ];
        
        this.display(localMeals);
    },
    
    getIcon(type) {
        const icons = {
            breakfast: 'egg',
            lunch: 'drumstick-bite',
            dinner: 'fish',
            snack: 'apple-alt'
        };
        return icons[type] || 'utensils';
    }
};

// Quick Actions
const quickActions = {
    logMeal() {
        this.showModal('Log Meal', 'Track your nutrition intake');
    },
    
    addWorkout() {
        this.showModal('Add Workout', 'Record your exercise session');
    },
    
    logWater() {
        const current = parseInt(elements.todayWater.textContent) || 0;
        const newValue = current + 0.25;
        elements.todayWater.textContent = newValue.toFixed(1);
        this.showToast('Water logged! +250ml', 'success');
    },
    
    logSleep() {
        this.showModal('Log Sleep', 'Track your sleep quality');
    },
    
    showModal(title, description) {
        this.showToast(`${title} feature opened`, 'info');
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : type === 'error' ? '#EF4444' : '#4F46E5'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Charts initialization
const charts = {
    init() {
        this.initHealthScore();
        this.initActivityChart();
    },
    
    initHealthScore() {
        const ctx = document.getElementById('healthScoreChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [87, 13],
                    backgroundColor: ['#4F46E5', '#E5E7EB'],
                    borderWidth: 0,
                    circumference: 270,
                    rotation: 225
                }]
            },
            options: {
                cutout: '75%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    },
    
    initActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Steps',
                        data: [8500, 10200, 7800, 11000, 9200, 12500, 9500],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { family: 'Inter', size: 12 }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 12 }, color: '#6B7280' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [4, 4], drawBorder: false },
                        ticks: {
                            font: { family: 'Inter', size: 12 },
                            color: '#6B7280',
                            callback: function(value) {
                                return value >= 1000 ? value/1000 + 'k' : value;
                            }
                        }
                    }
                }
            }
        });
    }
};

// Event listeners
function setupEventListeners() {
    // AI Chat
    if (elements.sendMessage) {
        elements.sendMessage.addEventListener('click', aiChat.sendMessage.bind(aiChat));
    }
    
    if (elements.chatInput) {
        elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') aiChat.sendMessage();
        });
    }
    
    // Meal Plan
    if (elements.generateMealPlan) {
        elements.generateMealPlan.addEventListener('click', mealPlan.generate.bind(mealPlan));
    }
    
    // Quick Actions
    if (elements.logMeal) {
        elements.logMeal.addEventListener('click', quickActions.logMeal.bind(quickActions));
    }
    
    if (elements.addWorkout) {
        elements.addWorkout.addEventListener('click', quickActions.addWorkout.bind(quickActions));
    }
    
    if (elements.logWater) {
        elements.logWater.addEventListener('click', quickActions.logWater.bind(quickActions));
    }
    
    if (elements.logSleep) {
        elements.logSleep.addEventListener('click', quickActions.logSleep.bind(quickActions));
    }
    
    // Suggestion tags
    document.querySelectorAll('.suggestion-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            if (elements.chatInput) {
                elements.chatInput.value = tag.textContent;
                elements.chatInput.focus();
            }
        });
    });
    
    // Tab switching
    document.querySelectorAll('.meal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.meal-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Add CSS animations
function addAnimations() {
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    data.load();
    mealPlan.displayLocal();
    charts.init();
    setupEventListeners();
    addAnimations();
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(err => console.log('SW registration failed:', err));
}