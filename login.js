document.addEventListener('DOMContentLoaded', () => {
    const googleBtn = document.getElementById('google-login-btn');
    
    // Check if user is already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            handleRedirect();
        }
    });

    googleBtn.addEventListener('click', () => {
        // Show loading state
        googleBtn.innerHTML = '<div style="width:24px;height:24px;border:3px solid #ccc;border-top-color:var(--primary);border-radius:50%;animation:spin 1s linear infinite;"></div> <span>Signing in...</span>';
        googleBtn.disabled = true;
        
        auth.signInWithPopup(googleProvider)
            .then((result) => {
                handleRedirect();
            })
            .catch((error) => {
                console.error("Authentication Error:", error);
                alert("Failed to sign in: " + error.message);
                // Reset button
                googleBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" class="google-icon"><span>Continue with Google</span>';
                googleBtn.disabled = false;
            });
    });

});

let isRedirecting = false;

function handleRedirect() {
    if (isRedirecting) return;
    
    // If there's a stored redirect URL, go there. Otherwise, go to home.
    let redirectUrl = sessionStorage.getItem('redirect_after_login');
    
    if (redirectUrl) {
        isRedirecting = true;
        sessionStorage.removeItem('redirect_after_login');
        // Prevent redirecting back to login page
        if (redirectUrl.includes('/login')) {
            redirectUrl = '/';
        }
        window.location.href = redirectUrl;
    } else {
        // Only redirect to home if we aren't already there and no redirect URL exists
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
            isRedirecting = true;
            window.location.href = '/';
        }
    }
}
