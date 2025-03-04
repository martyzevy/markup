import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

const joinButton = document.getElementById('join');
const myOrgsDiv = document.getElementById('orgs');
const joinOrgDiv = document.getElementById('join-org');
const signInOutButton = document.getElementById('sign-in-out');
const signInUpDiv = document.getElementById('sign-in-up-form');
const profilePic = document.getElementById('profile-pic');
var orgListItems = document.querySelectorAll('#orgs li');

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
    await displayUserOrganizations(user);
    
    // Now query for orgListItems after organizations are added
    const orgListItems = document.querySelectorAll('#orgs li');
    
    joinButton.disabled = false;
    joinButton.style.cursor = 'pointer';
    joinButton.style.opacity = '1';
    joinButton.innerHTML = 'Join an Organization';

    // Check if Chrome storage has a selected organization and if so select it
    const result = await chrome.storage.local.get('selectedOrg')
        .then((result) => {
            console.log('Selected org:', result.selectedOrg);
            const selectedOrg = result.selectedOrg;
            if (selectedOrg) {
                console.log('orgListItems:', orgListItems);
                orgListItems.forEach((org) => {
                    if (org.dataset.orgId === selectedOrg) {
                        console.log('Selecting org:', org.dataset.orgId);
                        org.classList.add('selected');
                    } else{
                        console.log('Deselecting org:', org.dataset.orgId);
                        org.classList.remove('selected');
                    }
                });
            } else if (orgListItems.length > 0) {
                orgListItems[0].classList.add('selected');
                // Save the selected organization to Chrome storage
                chrome.storage.local.set({ selectedOrg: orgListItems[0].dataset.orgId }, () => {
                    console.log('Organization selected:', orgListItems[0].dataset.orgId);
                });
            }
        });
}

async function displayUserOrganizations(user) {
    if (!user.organizations || user.organizations.length === 0) {
        return;
    }

    myOrgsDiv.innerHTML = ''; // Clear existing organizations

    // get updated user.organizations
    await chrome.storage.local.get('loggedInUser', (result) => {
        user = result.loggedInUser;
    });

    // Update user.organizations to include the new organization from firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        user = docSnap.data();
    }

    for (const orgId of user.organizations) {
        const orgRef = doc(db, "organizations", orgId);
        try {
            const orgSnap = await getDoc(orgRef);
            if (orgSnap.exists()) {
                const orgName = orgSnap.data().Name;
                const org = document.createElement('li');
                org.dataset.orgId = orgId; 
                org.innerHTML = orgName;
                myOrgsDiv.appendChild(org);
            }
        } catch (error) {
            alert(`Error getting organization data: ${error.message}`);
        }
    }
}


signInOutButton.addEventListener('click', (e) => {
    signUp(e);
});

// Event delegation for organization clicks
myOrgsDiv.addEventListener('click', (e) => {
    // updated orgListItems
    orgListItems = document.querySelectorAll('#orgs li');
    const org = e.target.closest('li'); 
    console.log('org clicked:', org);
    console.log('orgListItems:', orgListItems.length);
    if (org && orgListItems.length > 0) {
        console.log('org clicked 2:', org);
        e.preventDefault();
        org.classList.toggle('selected');
        
        // Deselect all other organizations
        const orgListItems = document.querySelectorAll('#orgs li');
        orgListItems.forEach((otherOrg) => {
            if (otherOrg !== org) {
                otherOrg.classList.remove('selected');
            }
        });

        const orgId = org.dataset.orgId;
        if (org.classList.contains('selected')) {
            // Save the selected organization to Chrome storage
            chrome.storage.local.set({ selectedOrg: orgId }, () => {
                console.log('Organization selected:', orgId);
            });
        } else{
            // Clear the selected organization from Chrome storage
            chrome.storage.local.remove('selectedOrg', () => {
                console.log('Organization deselected:', orgId);
            });
        }
        
    }
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
                                    signInUpDiv.innerHTML = '';
                                } else {
                                    alert('User not found.');
                                }
                            })
                            .catch((error) => {
                                alert(`Error getting user data: ${error.message}`);
                        
                        
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
    myOrgsDiv.innerHTML = '';
    joinButton.disabled = true;
    joinButton.style.cursor = 'not-allowed';
    joinButton.style.opacity = '0.6';
    joinButton.innerHTML = 'Log in to Join an Organization';
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
    joinOrgButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const orgCode = orgCodeInput.value.trim();
    
        if (!orgCode) {
            alert('Please enter an organization code.');
            return;
        }
    
        try {
            // Get the logged-in user's UID from Chrome storage
            const result = await chrome.storage.local.get('loggedInUser');
            const userId = result.loggedInUser.uid;
    
            if (!userId) {
                alert('User not logged in.');
                return;
            }
    
            // Look for the organization in Firestore
            const orgRef = doc(db, "organizations", orgCode);
            const orgSnap = await getDoc(orgRef);
    
            if (!orgSnap.exists()) {
                alert('Organization not found.');
                return;
            }
    
            const orgId = orgSnap.id;
    
            // Add the organization to the user's list of organizations
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                organizations: arrayUnion(orgId), // Use arrayUnion to append to the array
            });
            console.log('Organization joined successfully.');
            
            // Add the user to the organization's list of users
            const orgUsersRef = doc(db, "organizations", orgId);
            await updateDoc(orgUsersRef, {
                users: arrayUnion(userId), // Use arrayUnion to append to the array
            });
            console.log('User added to organization successfully.');

            // Save the selected organization to Chrome storage though User.organizations
            // Get the user data from chrome storage
            const user = result.loggedInUser;
            user.organizations.push(orgId);
            
            // Update UI
            const orgName = orgSnap.data().Name;
            const org = document.createElement('li');
            org.dataset.orgId = orgId; 
            org.innerHTML = orgName;
            myOrgsDiv.appendChild(org);
            orgCodeInput.value = '';

        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}`);
        }
    });
});