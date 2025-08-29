// firebase-config.js
// Firebase configuration using the compat version (v9 compat mode)

// Initialize Firebase (the scripts are already loaded in HTML)
const firebaseConfig = {
    apiKey: "AIzaSyCiDlWkYlCgfYJYsQVMNPrLwLmFUaUUaf0",
    authDomain: "ewde-23aa4.firebaseapp.com",
    projectId: "ewde-23aa4",
    storageBucket: "ewde-23aa4.firebasestorage.app",
    messagingSenderId: "453306204148",
    appId: "1:453306204148:web:3e5c9069ab3d31fdbcc3a1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();

// Firebase Authentication wrapper
class FirebaseAuthService {
    constructor() {
        this.auth = auth;
        this.currentUser = null;
        
        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });

        console.log('Firebase Authentication initialized');
    }

    // Handle authentication state changes
    handleAuthStateChange(user) {
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        if (user) {
            console.log('User signed in:', user.email);
            
            // Hide auth, show app
            if (authContainer) authContainer.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
            
            // Update user info
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
            
            // Clear any auth messages
            this.clearAuthMessage();
            
        } else {
            console.log('User signed out');
            
            // Show auth, hide app
            if (authContainer) authContainer.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            
            // Clear user info
            const userEmailElement = document.getElementById('user-email');
            if (userEmailElement) {
                userEmailElement.textContent = '';
            }
        }
    }

    // Sign up new user
    async signUp(email, password) {
        try {
            console.log('Attempting signup for:', email);
            
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('Signup successful:', userCredential.user.email);
            
            return {
                success: true,
                user: userCredential.user,
                message: 'Account created successfully!'
            };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error),
                code: error.code
            };
        }
    }

    // Sign in existing user
    async signIn(email, password) {
        try {
            console.log('Attempting signin for:', email);
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('Signin successful:', userCredential.user.email);
            
            return {
                success: true,
                user: userCredential.user,
                message: 'Login successful!'
            };
        } catch (error) {
            console.error('Signin error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error),
                code: error.code
            };
        }
    }

    // Sign out user
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('Signout successful');
            return {
                success: true,
                message: 'Logged out successfully!'
            };
        } catch (error) {
            console.error('Signout error:', error);
            return {
                success: false,
                error: 'Failed to sign out. Please try again.'
            };
        }
    }

    // Get user-friendly error messages
    getErrorMessage(error) {
        const errorMessages = {
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
            'auth/missing-password': 'Please enter a password.',
            'auth/missing-email': 'Please enter an email address.',
            'auth/internal-error': 'An internal error occurred. Please try again.'
        };

        return errorMessages[error.code] || `Authentication error: ${error.message}`;
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    isSignedIn() {
        return this.currentUser !== null;
    }

    showAuthMessage(message, isError = false) {
        const authMessageElement = document.getElementById('auth-message');
        if (authMessageElement) {
            authMessageElement.innerHTML = message;
            authMessageElement.className = isError ? 'error-message' : 'success-message';
            authMessageElement.style.display = 'block';
            
            // Auto-hide success messages
            if (!isError) {
                setTimeout(() => {
                    authMessageElement.style.display = 'none';
                }, 5000);
            }
        }
    }

    clearAuthMessage() {
        const authMessageElement = document.getElementById('auth-message');
        if (authMessageElement) {
            authMessageElement.style.display = 'none';
        }
    }
}

// Create global Firebase Auth instance
window.FirebaseAuth = new FirebaseAuthService();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, Firebase Auth ready');
    
    // Hide loading screen after a delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }, 1500);
    
    // Add keyboard shortcuts
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }

    // Clear auth messages when user starts typing
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            window.FirebaseAuth.clearAuthMessage();
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            window.FirebaseAuth.clearAuthMessage();
        });
    }
});