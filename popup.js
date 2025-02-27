import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const joinButton = document.getElementById('join');
const myOrgsDiv = document.getElementById('orgs');
const joinOrgDiv = document.getElementById('join-org');
const signInOutButton = document.getElementById('sign-in-out');
const signInUpDiv = document.getElementById('sign-in-up-form');
const profilePic = document.getElementById('profile-pic');

profilePic.addEventListener('dblclick', (e) => {
    e.preventDefault();
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            // Update the profile picture src
            profilePic.src = event.target.result;

            // Get the Firebase UID from Chrome storage
            const result = await chrome.storage.local.get('loggedInUser');
            const firebase_uid = result.loggedInUser.uid;

            if (!firebase_uid) {
                alert('User not logged in.');
                return;
            }

            // Update Firestore
            const docRef = doc(db, "users", firebase_uid);
            try {
                // Check if the document exists
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    // Update the user's profile picture in Firestore
                    await updateDoc(docRef, {
                        pic: event.target.result, // Save the base64-encoded image
                    });
                    console.log('Profile picture updated successfully.');
                } else {
                    alert('User not found.');
                }
            } catch (error) {
                alert(`Error updating profile picture: ${error.message}`);
            }
        };

        // Read the file as a Data URL
        reader.readAsDataURL(file);
    }
});

async function updateUIForSignedInUser(user) {
    console.log('updateUIForSignedInUser');
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
    signUp(e);
});

const signUp = async (e) => {
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
        signUpButton.addEventListener('click', (e2) => {
            console.log('signUpButton pressed');
            e2.preventDefault();

            // Gather input values
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const phone = phoneInput.value.trim();

            // Validate inputs
            if (firstName && lastName && email && password && phone) {
                signInUpDiv.innerHTML = '';
                addUserToDb(firstName, lastName, email, phone, password);
            } else {
                alert('Please fill out all fields.');
            }
        });

        // Handle log-in logic
        logInButton.addEventListener('click', (e) => {
            e.preventDefault();

            const email = logInEmailInput.value.trim();
            const password = logInPasswordInput.value.trim();

            if (email && password) {
                signInWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        const firebase_uid = user.uid;
                        // Get user data from Firestore
                        const docRef = doc(db, "users", firebase_uid);
                        getDoc(docRef)
                            .then((docSnap) => {
                                if (docSnap.exists()) {
                                    const userData = docSnap.data();
                                    chrome.storage.local.set({ loggedInUser: userData }, () => {
                                        updateUIForSignedInUser(userData);
                                    });
                                    alert('Sign-in successful!');
                                } else {
                                    alert('User not found.');
                                }
                            })
                            .catch((error) => {
                                alert(`Error getting user data: ${error.message}`);
                        signInUpDiv.innerHTML = '';
                        alert('Sign-in successful!');
                    })
                    .catch((error) => {
                        alert(`Sign-in failed: ${error.message}`);
                    });
                });
            } else{
                alert('Please fill out all fields.');
            }
        });


    } else {
        signOut();
    }
}

async function addUserToDb(firstName, lastName, email, phone, password) {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                uid: user.uid, 
                name: `${firstName} ${lastName}`,
                email: email,
                phone: phone,
            };
            chrome.storage.local.set({ loggedInUser: userData }, () => {
                updateUIForSignedInUser(userData);
                signInOutButton.disabled = false;
            });
            alert('Sign-up successful!');
        })
        .catch((error) => {
            alert(`Sign-up failed: ${error.message}`);
        });
        await setDoc(doc(db, "users", user.uid), userData)
}



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