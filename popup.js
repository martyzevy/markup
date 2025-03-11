import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";

const joinButton = document.getElementById('join');
const myOrgsDiv = document.getElementById('orgs');
const joinOrgDiv = document.getElementById('join-org');
const signInOutButton = document.getElementById('sign-in-out');
const signInUpDiv = document.getElementById('sign-in-up-form');
const profilePic = document.getElementById('profile-pic');
var orgListItems = document.querySelectorAll('#orgs li');
const createOrgButton = document.getElementById('create');
const creatOrgDiv = document.getElementById('create-org-form');
const popupCard = document.getElementById('org-info');
const closeBtn = document.getElementById('closeBtn');

function styleCreateOrgForm() {
    creatOrgDiv.style.display = 'block';

    // Apply consistent styling to the form container
    creatOrgDiv.style.backgroundColor = '1px solid #ccc';
    creatOrgDiv.style.border = '1px solid #007bff';
    creatOrgDiv.style.borderRadius = '10px';
    creatOrgDiv.style.padding = '10px';
    creatOrgDiv.style.marginTop = '10px';

    // Style the input fields
    const inputs = creatOrgDiv.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.padding = '5px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '5px';
        input.style.marginBottom = '10px';
        input.style.width = '95%';
        input.style.marginRight = '10px';
    });

    // Style the file input specifically
    //const fileInput = creatOrgDiv.querySelector('input[type="file"]');
    //fileInput.style.marginBottom = '10px';

    /*Style the label
    const label = creatOrgDiv.querySelector('label');
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    label.style.fontSize = '14px';
    label.style.color = '#333';*/

    // Style the create button
    const createButton = creatOrgDiv.querySelector('button');
    createButton.style.padding = '5px 10px';
    createButton.style.border = '1px solid #ccc';
    createButton.style.borderRadius = '30px';
    createButton.style.backgroundColor = '#007bff';
    createButton.style.color = 'white';
    createButton.style.cursor = 'pointer';
    createButton.style.marginTop = '10px';
    createButton.style.width = '100%';

    // Add hover effect to the create button
    createButton.addEventListener('mouseover', () => {
        createButton.style.backgroundColor = '#0056b3';
    });

    createButton.addEventListener('mouseout', () => {
        createButton.style.backgroundColor = '#007bff';
    });

    // Handle create button click
    createButton.addEventListener('click', async (e) => {   
        // Check if the input fields are filled out
        const orgName = document.getElementById('org-name').value.trim();
        const orgDesc = document.getElementById('org-desc').value.trim();
        //const file = fileInput.files[0];

        if (!orgName || !orgDesc) {
            alert('Please fill out all fields.');
            return;
        }

        var orgUsers = [];
        // Get the logged-in user's UID from Chrome storage
        const result = await chrome.storage.local.get('loggedInUser');
        const userId = result.loggedInUser.uid;
        console.log('userId:', userId);
        orgUsers.push(userId);

        // Create a new organization in Firestore
        const orgData = {
            Name: orgName,
            Description: orgDesc,
            users: orgUsers,
            notes: [],
            owner: userId,
        };

        // generate a random firebase id for the organization
        var orgId = Math.random().toString(36).substring(7);
        // make the orgID all uppercase
        orgId = orgId.toUpperCase();

        // Add the organization to Firestore
        const orgRef = doc(db, "organizations", orgId);
        await setDoc(orgRef, orgData);
        // Add the organization to the user's list of organizations
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            organizations: arrayUnion(orgId), // Use arrayUnion to append to the array
        });
        console.log('User added to organization successfully.');
        creatOrgDiv.style.display = 'none';
        updateUIForSignedInUser(result.loggedInUser);
    });
}

createOrgButton.addEventListener('click', (e) => {
    if (creatOrgDiv.style.display != 'none') {
        creatOrgDiv.style.display = 'none';
        return;
    } else {
        const joinDiv = document.getElementById('join-org-form');
        if (joinDiv.style.display != 'none') {
            joinDiv.style.display = 'none';
        }
        styleCreateOrgForm();
    }
});

/*profilePic.addEventListener('dblclick', (e) => {
    e.preventDefault();
    fileInput.click();
});*/

/*fileInput.addEventListener('change', (e) => {
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
});*/

async function updateUIForSignedInUser(user) {
    console.log('updateUIForSignedInUser');
    
    // Change to "Sign Out" button
    signInOutButton.innerHTML = 'Sign Out';

    //const settingsButton = document.getElementById('profile-settings');
    //settingsButton.style.display = 'block';

    // Display user's name and profile picture
    const profileName = document.getElementById('profile-name');
    profileName.innerHTML = user.name;
    //const profilePic = document.getElementById('profile-pic');
    //profilePic.src = user.pic || 'icons/default-profile.png'; // Use default if user.pic is undefined

    console.log('displayUserOrganizations');
    // Display user's organizations
    await displayUserOrganizations(user);

    // Now query for orgListItems after organizations are added
    const orgListItems = document.querySelectorAll('#orgs li');

    joinButton.disabled = false;
    document.getElementById('create').disabled = false;
    joinButton.style.cursor = 'pointer';
    joinButton.style.opacity = '1';
    joinButton.innerHTML = 'Join an Organization';

    // Check if Chrome storage has a selected organization and if so select it
    const result = await chrome.storage.local.get('selectedOrg');
    const selectedOrg = result.selectedOrg;

    if (selectedOrg) {
        console.log('Selected org:', selectedOrg);
        orgListItems.forEach((org) => {
            if (org.dataset.orgId === selectedOrg) {
                console.log('Selecting org:', org.dataset.orgId);
                org.classList.add('selected');
            } else {
                console.log('Deselecting org:', org.dataset.orgId);
                org.classList.remove('selected');
            }
        });
    } else if (orgListItems.length > 0) {
        orgListItems[0].classList.add('selected');
        const firstOrgId = orgListItems[0].dataset.orgId;

        // Save the selected organization to Chrome storage
        await chrome.storage.local.set({ selectedOrg: firstOrgId });
        console.log('Organization selected:', firstOrgId);
    }
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

function guestViewOrg(orgId, orgName, orgDescription, orgUsers, orgOwner) {
    popupCard.style.display = 'flex';
    popupCard.style.justifyContent = 'center';
    popupCard.style.alignItems = 'center';
    popupCard.style.position = 'fixed';
    popupCard.style.top = '0';
    popupCard.style.left = '0';
    popupCard.style.width = '100%';
    popupCard.style.height = '100%';
    popupCard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    popupCard.style.zIndex = '1000';

    // popup content is the first child of the popupCard
    const popupContent = popupCard.children[0];
    popupContent.style.backgroundColor = '#fff';
    popupContent.style.padding = '20px';
    popupContent.style.borderRadius = '10px';
    popupContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popupContent.style.maxWidth = '500px';
    popupContent.style.width = '100%';
    popupContent.style.overflowY = 'auto';
    popupContent.style.maxHeight = '90vh';

    // get the organization name from firestore
    const orgRef = doc(db, "organizations", orgId);

    // get the owner's name from firestore
    const ownerRef = doc(db, "users", orgOwner);
    var ownerName = '';
    getDoc(ownerRef)
        .then((ownerSnap) => {
            if (ownerSnap.exists()) {
                const ownerData = ownerSnap.data();
                ownerName = ownerData.name;
            } else {
                alert('Owner not found.');
            }
        });

    getDoc(orgRef)
        .then((orgSnap) => {
            if (orgSnap.exists()) {
                const orgData = orgSnap.data();
                const orgName = orgData.Name;
                popupContent.innerHTML = `<h3 style="margin: 0 0 10px 0; font-size: 24px; color: #007bff;">${orgName}</h3>`;
                popupContent.innerHTML += `<strong><h4 style="margin: 0 0 10px 0; font-size: 18px; color: black;">Join Code: ${orgId}</h4></strong>`;
                popupContent.innerHTML += `<h4 style="margin: 0 0 10px 0; font-size: 18px; color: black;">Owner: ${ownerName}</h4>`;
                const orgDescription = orgData.Description;
                popupContent.innerHTML += `<p style="margin: 0 0 10px 0; font-size: 16px; color: black;">${orgDescription}</p>`;
                const orgUsers = orgData.users;
                const orgUsersList = document.createElement('ul');
                orgUsersList.style.listStyleType = 'none';
                orgUsersList.style.padding = '0';
                orgUsersList.style.margin = '0';
                orgUsersList.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 18px; color: #007bff;">Members:</h4>';
                // loop through the users in the organization and get their names
                orgUsers.forEach((userId) => {
                    const userRef = doc(db, "users", userId);
                    getDoc(userRef)
                        .then((userSnap) => {
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                const user = document.createElement('li');
                                user.style.padding = '8px';
                                user.style.borderBottom = '1px solid #eee';
                                user.style.fontSize = '16px';
                                user.style.color = 'black';
                                user.innerHTML = userData.name;
                                orgUsersList.appendChild(user);
                            } else {
                                alert('User not found.');
                            }
                        })
                        .catch((error) => {
                            alert(`Error getting user data: ${error.message}`);
                        });
                });


                const leaveOrgButton = document.createElement('button');    
                leaveOrgButton.innerHTML = 'Leave Organization';
                leaveOrgButton.style.backgroundColor = '#dc3545';
                leaveOrgButton.style.color = 'white';
                leaveOrgButton.style.border = 'none';
                leaveOrgButton.style.padding = '10px 20px';
                leaveOrgButton.style.borderRadius = '5px';
                leaveOrgButton.style.cursor = 'pointer';
                leaveOrgButton.style.marginBottom = '10px';

                leaveOrgButton.addEventListener('click', async () => {
                    leaveOrg(orgId, userId);
                });
                popupContent.appendChild(leaveOrgButton);
                popupContent.appendChild(orgUsersList);
            } else {
                alert('Organization not found.');
            }
        })
        .catch((error) => {
            alert(`Error getting organization data: ${error.message}`);
        });
}

popupCard.addEventListener('click', function(event) {
    if (event.target === popupCard) {
      popupCard.style.display = 'none'; 
    }
});

closeBtn.addEventListener('click', function() {
    popupCard.style.display = 'none'; 
});

function leaveOrg(orgId, userId) {
    if (confirm('Are you sure you want to leave this organization?')) {
        const orgRef = doc(db, "organizations", orgId);
        const userRef = doc(db, "users", userId);

        // Remove user from organization's users array
        updateDoc(orgRef, {
            users: arrayRemove(userId)
        }).then(() => {
            // Remove organization from user's organizations array
            updateDoc(userRef, {
                organizations: arrayRemove(orgId)
            }).then(() => {
                alert('User removed successfully!');
            }).catch((error) => {
                alert(`Error updating user document: ${error.message}`);
            });
        }).catch((error) => {
            alert(`Error updating organization document: ${error.message}`);
        });
    }
}

// Function to Remove a User from the Organization
function removeUser(orgId, userId) {
    console.log('Remove user:', userId, 'from organization:', orgId);
    if (confirm('Are you sure you want to remove this user from the organization?')) {
        const orgRef = doc(db, "organizations", orgId);
        const userRef = doc(db, "users", userId);

        // Remove user from organization's users array
        updateDoc(orgRef, {
            users: arrayRemove(userId)
        }).then(() => {
            // Remove organization from user's organizations array
            updateDoc(userRef, {
                organizations: arrayRemove(orgId)
            }).then(() => {
                alert('User removed successfully!');
            }).catch((error) => {
                alert(`Error updating user document: ${error.message}`);
            });
        }).catch((error) => {
            alert(`Error updating organization document: ${error.message}`);
        });
    }
}

function ownerViewOrg(orgId, orgName, orgDescription, orgUsers, orgOwner) {
    popupCard.style.display = 'flex';
    popupCard.style.justifyContent = 'center';
    popupCard.style.alignItems = 'center';
    popupCard.style.position = 'fixed';
    popupCard.style.top = '0';
    popupCard.style.left = '0';
    popupCard.style.width = '100%';
    popupCard.style.height = '100%';
    popupCard.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    popupCard.style.zIndex = '1000';

    // popup content is the first child of the popupCard
    const popupContent = popupCard.children[0];
    popupContent.style.backgroundColor = '#fff';
    popupContent.style.padding = '20px';
    popupContent.style.borderRadius = '10px';
    popupContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popupContent.style.maxWidth = '500px';
    popupContent.style.width = '100%';
    popupContent.style.overflowY = 'auto';
    popupContent.style.maxHeight = '90vh';

    // Clear existing content
    popupContent.innerHTML = '';

    // get the organization name from firestore
    const orgRef = doc(db, "organizations", orgId);

    // get the owner's name from firestore
    const ownerRef = doc(db, "users", orgOwner);
    var ownerName = '';
    getDoc(ownerRef)
        .then((ownerSnap) => {
            if (ownerSnap.exists()) {
                const ownerData = ownerSnap.data();
                ownerName = ownerData.name;
            } else {
                alert('Owner not found.');
            }
        });

    getDoc(orgRef)
        .then((orgSnap) => {
            if (orgSnap.exists()) {
                const orgData = orgSnap.data();
                const orgName = orgData.Name;
                const orgDescription = orgData.Description;

                // Editable Organization Name
                popupContent.innerHTML = `
                    <h3 style="margin: 0 0 10px 0; font-size: 24px; color: #007bff;">
                        <input id="orgNameInput" type="text" value="${orgName}" style="border: none; text-align: center; margin-left: 10px; margin-right: 10px; width: 90%; font-size: 24px; color: #007bff; background: transparent;">
                    </h3>
                `;

                // Join Code and Owner
                popupContent.innerHTML += `<strong><h4 style="margin: 0 0 10px 0; font-size: 18px; color: black;">Join Code: ${orgId}</h4></strong>`;
                popupContent.innerHTML += `<h4 style="margin: 0 0 10px 0; font-size: 18px; color: black;">Owner: ${ownerName}</h4>`;

                // Editable Organization Description
                popupContent.innerHTML += `
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: black;">
                        <textarea id="orgDescriptionInput" style="width: 90%; height: 100px; border: 1px solid #ddd; border-radius: 5px; padding: 10px; font-size: 16px;">${orgDescription}</textarea>
                    </p>
                `;

                // Save Changes Button
                popupContent.innerHTML += `
                    <button id="saveChangesBtn" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
                        Save Changes
                    </button>
                `;

                // Users List
                const orgUsersList = document.createElement('ul');
                orgUsersList.style.listStyleType = 'none';
                orgUsersList.style.padding = '0';
                orgUsersList.style.margin = '0';
                orgUsersList.innerHTML = '<h4 style="margin: 0 0 10px 0; font-size: 18px; color: #007bff;">Members:</h4>';

                // Loop through the users in the organization and get their names
                orgUsers.forEach((userId) => {
                    const userRef = doc(db, "users", userId);
                    getDoc(userRef)
                        .then((userSnap) => {
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                const user = document.createElement('li');
                                user.style.padding = '8px';
                                user.style.borderBottom = '1px solid #eee';
                                user.style.fontSize = '16px';
                                user.style.color = 'black';
                                user.style.display = 'flex';
                                user.style.alignItems = 'center';
                                user.style.justifyContent = 'space-between';

                                // User Name
                                user.innerHTML = userData.name;

                                const removeUserBtn = document.createElement('i');
                                removeUserBtn.className = 'fas fa-trash-alt';
                                removeUserBtn.style.color = 'red';
                                removeUserBtn.style.cursor = 'pointer';
                                removeUserBtn.style.display = 'none';
                                removeUserBtn.onclick = () => removeUser(orgId, userId);

                                

                                if (userId !== orgOwner) {
                                    removeUserBtn.style.display = 'inline';
                                } else{
                                    const ownerInfo = document.createElement('i');
                                    ownerInfo.style.color = 'red';
                                    ownerInfo.innerHTML = 'Owner';
                                    user.appendChild(ownerInfo);
                                }
                                user.appendChild(removeUserBtn);
                                orgUsersList.appendChild(user);
                            } else {
                                alert('User not found.');
                            }
                        })
                        .catch((error) => {
                            alert(`Error getting user data: ${error.message}`);
                        });
                });

                // Delete Organization Button
                popupContent.innerHTML += `
                    <button id="deleteOrgBtn" style="background-color: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                        Delete Organization
                    </button>
                `;

                // Append the user list to the popup content
                popupContent.appendChild(orgUsersList);

                // Save Changes Event Listener
                document.getElementById('saveChangesBtn').addEventListener('click', () => {
                    const newName = document.getElementById('orgNameInput').value;
                    const newDescription = document.getElementById('orgDescriptionInput').value;

                    updateDoc(orgRef, {
                        Name: newName,
                        Description: newDescription
                    }).then(() => {
                        alert('Organization updated successfully!');
                    }).catch((error) => {
                        alert(`Error updating organization: ${error.message}`);
                    });
                });

                // Delete Organization Event Listener
                document.getElementById('deleteOrgBtn').addEventListener('click', () => {
                    console.log('Delete organization:', orgId);
                    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
                        deleteDoc(orgRef)
                            .then(() => {
                                alert('Organization deleted successfully!');
                                popupCard.style.display = 'none';
                            })
                            .catch((error) => {
                                alert(`Error deleting organization: ${error.message}`);
                            });
                    }
                });

            } else {
                alert('Organization not found.');
            }
        })
        .catch((error) => {
            alert(`Error getting organization data: ${error.message}`);
        });
}

myOrgsDiv.addEventListener('dblclick', (e) => {
    const org = e.target.closest('li');
    // get the owner of the organization from firestore
    const orgRef = doc(db, "organizations", org.dataset.orgId);
    getDoc(orgRef)
        .then((orgSnap) => {
            if (orgSnap.exists()) {
                const orgData = orgSnap.data();
                const orgOwner = orgData.owner;
                const orgUsers = orgData.users;
                const orgName = orgData.Name;
                const orgId = orgSnap.id;
                const orgDescription = orgSnap.Description;
                const result = chrome.storage.local.get('loggedInUser', (result) => {
                    const user = result.loggedInUser;
                    if (user.uid === orgOwner) {
                        ownerViewOrg(orgId, orgName, orgDescription, orgUsers, orgOwner);
                    } else {
                        guestViewOrg(orgId, orgName, orgDescription, orgUsers, orgOwner);
                    }
                });
            } else {
                alert('Organization not found.');
            }
        })
        .catch((error) => {
            alert(`Error getting organization data: ${error.message}`);
        });
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
        updateSelectedOrg(orgId); 
    }
});

async function updateSelectedOrg(orgId) {
    const result = await chrome.storage.local.get('loggedInUser');
    const user = result.loggedInUser;

    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
        selectedOrg: orgId,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'changeSelectedOrg',
            data: { selectedOrg: 'testOrg' },
          }, (response) => {
            if (response && response.success) {
              console.log('Content script function triggered successfully.');
            } else {
              console.error('Failed to trigger content script function.');
            }
          });
        }
      });

    console.log('Selected organization updated successfully.');
}


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
    //const settingsButton = document.getElementById('profile-settings');
    //settingsButton.style.display = 'none';

    // Clear user's name and profile picture
    const profileName = document.getElementById('profile-name');
    profileName.innerHTML = 'Guest';
    //const profilePic = document.getElementById('profile-pic');
    //profilePic.src = 'icons/default-profile.png';

    // TODO: Clear user's organizations
    myOrgsDiv.innerHTML = '';
    joinButton.disabled = true;
    document.getElementById('create').disabled = false;
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
    console.log('window.onload');
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
    var orgCodeInput;
    const joinDiv = document.getElementById('join-org-form');
    if (joinDiv.style.display === 'none') {
        const createDiv = document.getElementById('create-org-form');
        if (createDiv.style.display != 'none') {
            createDiv.style.display = 'none';
        }
        const joinDiv = document.getElementById('join-org-form');
        joinDiv.style.display = 'block';
        orgCodeInput = document.getElementById('org-join-code');
        orgCodeInput.style.border = '1px solid #007bff';
        orgCodeInput.style.paddingLeft = '10px';
        orgCodeInput.style.borderRadius = '15px';
        orgCodeInput.style.marginRight = '10px';
        orgCodeInput.style.width = '200px';
        orgCodeInput.style.height = '30px';
    } else{
        joinDiv.style.display = 'none';
        return;
    }
    var joinOrgButton = document.getElementById('join-org-button');

    /*Check if the elements are already appended
    var orgCodeInput = document.getElementById('org-code');
    var joinOrgButton = document.getElementById('join-org-button');
    const outerOuterDiv = document.getElementById('join-form');
    const outerDiv = document.createElement('div');


    if (orgCodeInput && joinOrgButton) {
        outerOuterDiv.innerHTML = '';
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
    outerDiv.appendChild(orgCodeInput);

    // Join button
    joinOrgButton = document.createElement('button');
    joinOrgButton.setAttribute('id', 'join-org-button');
    joinOrgButton.innerHTML = 'Join';
    outerDiv.appendChild(joinOrgButton);
    outerOuterDiv.appendChild(outerDiv);*/

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