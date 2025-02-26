const joinButton = document.getElementById('join');
const myOrgsDiv = document.getElementById('orgs');
const joinOrgDiv = document.getElementById('join-org');
const signInOutButton = document.getElementById('sign-in-out');
const signInUpDiv = document.getElementById('sign-in-up-form');

function updateUIForSignedInUser(user) {
    // Change to "Sign Out" button
    signInOutButton.innerHTML = 'Sign Out';

    const settingsButton = document.getElementById('profile-settings');
    settingsButton.style.display = 'block';

    // Display user's name and profile picture
    var profileName = document.getElementById('profile-name');
    profileName.innerHTML = user.name;
    var profilePic = document.getElementById('profile-pic');
    if (user.pic !== undefined){
        profilePic.src = user.pic;
    } else{
        profilePic.src = 'icons/default-profile.png';
    }

    // TODO: Display user's organizations
}

signInOutButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    var logInEmailInput = document.getElementById('log-in-email');
    if (logInEmailInput) {
        signInUpDiv.innerHTML = '';
        return;
    }

    // If the user is not signed in, show the sign-up form
    if (signInOutButton.innerHTML === 'Log in / Sign Up') {
        // Log in form
        logInEmailInput = document.createElement('input');
        logInEmailInput.setAttribute('type', 'email');
        logInEmailInput.setAttribute('id', 'log-in-email');
        logInEmailInput.setAttribute('placeholder', 'Email');
        logInEmailInput.setAttribute('required', 'true');

        const logInPasswordInput = document.createElement('input');
        logInPasswordInput.setAttribute('type', 'password');
        logInPasswordInput.setAttribute('id', 'log-in-password');
        logInPasswordInput.setAttribute('placeholder', 'Password');
        logInPasswordInput.setAttribute('required', 'true');

        const logInButton = document.createElement('button');
        logInButton.setAttribute('id', 'log-in-button');
        logInButton.innerHTML = 'Log In';

        signInUpDiv.appendChild(logInEmailInput);
        signInUpDiv.appendChild(logInPasswordInput);
        signInUpDiv.appendChild(logInButton);
        signInUpDiv.appendChild(document.createElement('br'));
        signInUpDiv.appendChild(document.createElement('hr'));

        // Sign up form
        const firstNameInput = document.createElement('input');
        firstNameInput.setAttribute('type', 'text');
        firstNameInput.setAttribute('id', 'first-name');
        firstNameInput.setAttribute('placeholder', 'First name');
        firstNameInput.setAttribute('required', 'true');

        const lastNameInput = document.createElement('input');
        lastNameInput.setAttribute('type', 'text');
        lastNameInput.setAttribute('id', 'last-name');
        lastNameInput.setAttribute('placeholder', 'Last name');
        lastNameInput.setAttribute('required', 'true');

        const emailInput = document.createElement('input');
        emailInput.setAttribute('type', 'email');
        emailInput.setAttribute('id', 'email');
        emailInput.setAttribute('placeholder', 'Email');
        emailInput.setAttribute('required', 'true');

        const passwordInput = document.createElement('input');
        passwordInput.setAttribute('type', 'password');
        passwordInput.setAttribute('id', 'password');
        passwordInput.setAttribute('placeholder', 'Password');
        passwordInput.setAttribute('required', 'true');

        const phoneInput = document.createElement('input');
        phoneInput.setAttribute('type', 'tel');
        phoneInput.setAttribute('id', 'phone');
        phoneInput.setAttribute('placeholder', 'Phone number');
        phoneInput.setAttribute('required', 'true');

        const signUpButton = document.createElement('button');
        signUpButton.setAttribute('id', 'sign-up-button');
        signUpButton.innerHTML = 'Sign Up';

        signInUpDiv.appendChild(firstNameInput);
        signInUpDiv.appendChild(lastNameInput);
        signInUpDiv.appendChild(emailInput);
        signInUpDiv.appendChild(phoneInput);
        signInUpDiv.appendChild(passwordInput);
        signInUpDiv.appendChild(signUpButton);

        // Handle sign-up logic
        signUpButton.addEventListener('click', (e) => {
            e.preventDefault();

            // Gather input values
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const phone = phoneInput.value.trim();

            // Validate inputs
            if (firstName && lastName && email && password && phone) {
                // Simulate sign-up logic (replace with actual API call)
                const user = {
                    name: `${firstName} ${lastName}`,
                    email: email,
                    phone: phone,
                };

                // Save user data to storage (or send to backend)
                chrome.storage.local.set({ loggedInUser: user }, () => {
                    updateUIForSignedInUser(user); 
                    signInOutButton.disabled = false; 
                });
            } else {
                alert('Please fill out all fields.');
            }
        });
    } else {
        signOut();
    }
});

function updateUIForSignedOutUser() {
    // Change to "Sign In" button
    signInOutButton.innerHTML = 'Log in / Sign Up';

    // Hide Settings Button
    const settingsButton = document.getElementById('profile-settings');
    settingsButton.style.display = 'none';

    // Clear user's name and profile picture
    const profileName = document.getElementById('profile-name');
    profileName.innerHTML = 'Guest';
    const profilePic = document.getElementById('profile-pic');
    profilePic.src = 'icons/default-profile.png';

    // TODO: Clear user's organizations
}

function signOut() {
    chrome.storage.local.remove('loggedInUser', () => {
        updateUIForSignedOutUser();
    });
}

window.onload = function () {
    chrome.storage.local.get('loggedInUser', (result) => {
        if (result.loggedInUser) {
            updateUIForSignedInUser(result.loggedInUser);
        } else {
            updateUIForSignedOutUser();
        }
    });
};

joinButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Check if the elements are already appended
    var orgCodeInput = document.getElementById('org-code');
    var joinOrgButton = document.getElementById('join-org-button');

    if (orgCodeInput && joinOrgButton) {
        joinOrgDiv.removeChild(orgCodeInput);
        joinOrgDiv.removeChild(joinOrgButton);
        return;
    } 

    // Input for organization code
    orgCodeInput = document.createElement('input');
    orgCodeInput.setAttribute('type', 'text');
    orgCodeInput.style.border = '1px solid #007bff';
    orgCodeInput.style.paddingLeft = '10px';
    orgCodeInput.setAttribute('id', 'org-code');
    orgCodeInput.setAttribute('placeholder', 'Organization Code');
    orgCodeInput.style.borderRadius = '15px';
    orgCodeInput.style.marginRight = '10px';
    orgCodeInput.style.width = '125px';
    orgCodeInput.style.height = '30px';
    joinOrgDiv.appendChild(orgCodeInput);

    // Join button
    joinOrgButton = document.createElement('button');
    joinOrgButton.setAttribute('id', 'join-org-button');
    joinOrgButton.innerHTML = 'Join';
    joinOrgDiv.appendChild(joinOrgButton);

    // Handle joining the organization
    joinOrgButton.addEventListener('click', () => {
        const orgCode = orgCodeInput.value.trim();

        if (orgCode) {
            joinOrgButton.disabled = true;

            // Simulate joining an organization (replace with your actual logic)
            setTimeout(() => {
                // Optionally, remove the input and button after joining
                joinOrgDiv.removeChild(orgCodeInput);
                joinOrgDiv.removeChild(joinOrgButton);
            }, 1000); // Simulate a 1-second delay for joining
        } else {
            alert('Please enter an organization code.');
        }
    });
});