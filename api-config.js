// API Configuration for Development and Production
const API_CONFIG = {
    // Development environment (localhost)
    development: {
        baseURL: 'http://localhost:5001',
        timeout: 10000
    },
    
    // Production environment (GitHub Pages)
    production: {
        // For demo purposes, we'll use mock responses
        // In real production, you'd deploy your backend to a service like:
        // - Heroku, Vercel, Railway, or AWS
        baseURL: null, // Will trigger mock mode
        timeout: 10000
    }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

const currentConfig = isDevelopment ? API_CONFIG.development : API_CONFIG.production;

// Export API configuration
window.API_CONFIG = currentConfig;

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const url = currentConfig.baseURL ? 
        `${currentConfig.baseURL}${endpoint}` : 
        null;
    
    // If no baseURL (production), return mock response
    if (!url) {
        return mockResponse(endpoint, options);
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: currentConfig.timeout,
        ...options
    };
    
    try {
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Mock responses for production demo
function mockResponse(endpoint, options) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const method = options.method || 'GET';
            
            switch (endpoint) {
                case '/api/auth/login':
                    if (method === 'POST') {
                        const body = JSON.parse(options.body);
                        if (body.email && body.password) {
                            resolve({
                                success: true,
                                message: 'Login successful (Demo Mode)',
                                token: 'demo-token-' + Date.now(),
                                user: {
                                    id: 'demo-user',
                                    email: body.email,
                                    userType: body.userType || 'parent'
                                }
                            });
                        } else {
                            reject(new Error('Invalid credentials'));
                        }
                    }
                    break;
                    
                case '/api/auth/register':
                    if (method === 'POST') {
                        resolve({
                            success: true,
                            message: 'Registration successful (Demo Mode)',
                            user: {
                                id: 'demo-user-' + Date.now(),
                                email: JSON.parse(options.body).email
                            }
                        });
                    }
                    break;
                    
                case '/api/auth/send-otp':
                    resolve({
                        success: true,
                        message: 'OTP sent (Demo Mode)'
                    });
                    break;
                    
                case '/api/auth/verify-otp':
                    resolve({
                        success: true,
                        message: 'OTP verified (Demo Mode)',
                        token: 'demo-token-' + Date.now()
                    });
                    break;
                    
                default:
                    resolve({
                        success: true,
                        message: 'Demo mode - API endpoint simulated',
                        data: []
                    });
            }
        }, 1000); // Simulate network delay
    });
}

// Export the apiCall function
window.apiCall = apiCall;
