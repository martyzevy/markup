import { db } from "./firebase.js";
import { doc, getDoc, setDoc, arrayUnion, updateDoc } from "firebase/firestore";

var annotate = false;
var user = null;
var firebase_user = null;

// Make window.onload async to await getUser
window.onload = async function () {
  console.log('Content script loaded');
  user = await getUser(); // Await the user data
  console.log('User after load:', user);

  const currentUrl = window.location.href; // Get current website URL
  await loadNotesForCurrentWebsite(currentUrl); // Load notes for the current website
  createHighlighterButton(); // Create the button after user is set
};

async function getUser() {
  const result = await chrome.storage.local.get('loggedInUser');
  console.log('User from storage:', result.loggedInUser);
  
  const uid = result.loggedInUser.uid;
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    firebase_user = data;
  } else {
    console.error('User document does not exist');
  }

  return result.loggedInUser; // Return the user directly
}

function createHighlighterButton() {
  const button = document.createElement('div');
  button.id = 'highlighter-button';
  button.innerHTML = '🖍️';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.width = '40px';
  button.style.height = '40px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  button.style.zIndex = '1000';

  document.body.appendChild(button);
  button.addEventListener('click', () => {
    annotate = !annotate;
    console.log('annotate', annotate);
  });
}

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection.toString().trim() && annotate) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Calculate positions
    const selectionX = rect.right; // Right edge of the selected text
    const selectionY = rect.top + window.scrollY; // Top of the selected text
    const noteX = window.innerWidth - 260; // Right side of the screen (260px width for the note)
    const noteY = selectionY; // Align note vertically with the selection

    // Create a line connecting the selection to the note
    const line = document.createElement('div');
    line.style.position = 'absolute';
    line.style.top = `${selectionY + rect.height / 2}px`; // Center the line vertically
    line.style.left = `${selectionX}px`;
    line.style.width = `${noteX - selectionX}px`;
    line.style.height = '2px';
    line.style.backgroundColor = '#007bff';
    line.style.zIndex = '1000';
    line.style.opacity = '0.8';
    line.style.transformOrigin = 'left';
    line.style.transform = 'scaleX(1)';
    line.style.transition = 'transform 0.3s ease';
    document.body.appendChild(line);

    // Create a note container on the right side of the screen
    const noteContainer = document.createElement('div');
    noteContainer.style.position = 'absolute';
    noteContainer.style.top = `${noteY}px`;
    noteContainer.style.right = '20px'; // Add more padding from the right edge
    noteContainer.style.backgroundColor = '#ffffff';
    noteContainer.style.border = '1px solid #e0e0e0';
    noteContainer.style.padding = '15px';
    noteContainer.style.borderRadius = '8px';
    noteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    noteContainer.style.zIndex = '1000';
    noteContainer.style.width = '240px'; // Slightly wider for better spacing
    noteContainer.style.fontFamily = 'Arial, sans-serif';

    // Add an "X" button in the top-left corner
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×'; // "X" symbol
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.left = '5px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    closeButton.addEventListener('click', () => {
      document.body.removeChild(noteContainer);
      document.body.removeChild(line);
    });
    noteContainer.appendChild(closeButton);

    // Add a textarea for the note input
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '80px';
    textarea.style.marginBottom = '10px';
    textarea.style.border = '1px solid #e0e0e0';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.placeholder = 'Add your note...';
    noteContainer.appendChild(textarea);

    // Add a "Reply" button
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.style.backgroundColor = '#007bff';
    replyButton.style.color = 'white';
    replyButton.style.border = 'none';
    replyButton.style.padding = '8px 16px';
    replyButton.style.cursor = 'pointer';
    replyButton.style.borderRadius = '4px';
    replyButton.style.fontSize = '14px';
    replyButton.style.transition = 'background-color 0.3s ease';
    replyButton.addEventListener('mouseenter', () => {
      replyButton.style.backgroundColor = '#0056b3';
    });
    replyButton.addEventListener('mouseleave', () => {
      replyButton.style.backgroundColor = '#007bff';
    });
    noteContainer.appendChild(replyButton);

    // Add the note container to the page
    document.body.appendChild(noteContainer);

    // Handle reply submission
    replyButton.addEventListener('click', () => {
      const noteText = textarea.value.trim();
      if (noteText) {
        // Save the note (e.g., to Firebase or local storage)
        console.log('Note:', noteText);

        // Display the note permanently
        const noteDisplay = document.createElement('div');
        noteDisplay.textContent = noteText;
        noteDisplay.style.backgroundColor = '#f9f9f9';
        noteDisplay.style.border = '1px solid #e0e0e0';
        noteDisplay.style.padding = '10px';
        noteDisplay.style.borderRadius = '4px';
        noteDisplay.style.marginTop = '10px';
        noteDisplay.style.fontSize = '14px';
        noteDisplay.style.color = '#333';
        noteContainer.insertBefore(noteDisplay, textarea);

        // Clear the textarea
        textarea.value = '';

        // Animate the line to fade out
        line.style.transform = 'scaleX(0)';
        setTimeout(() => {
          document.body.removeChild(line);
        }, 300);
      } else {
        alert('Please enter a note.');
      }
    });

    // Add a Submit Button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.backgroundColor = '#007bff';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.padding = '8px 16px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.borderRadius = '4px';
    submitButton.style.fontSize = '14px';
    submitButton.style.transition = 'background-color 0.3s ease';
    submitButton.style.marginTop = '10px';

    submitButton.addEventListener('mouseenter', () => {
      submitButton.style.backgroundColor = '#0056b3';
    });

    submitButton.addEventListener('mouseleave', () => {
      submitButton.style.backgroundColor = '#007bff';
    });

    noteContainer.appendChild(submitButton);

    // Handle submit button
    submitButton.addEventListener('click', async () => {
      console.log('Submit button clicked');
      console.log('User:', user);
      const noteText = textarea.value.trim();
      if (noteText) {
        if (!user) {
          console.error('User not found');
          alert('User not logged in. Please log in and try again.');
          return;
        }

        try {
          // Get User's "selectedOrg" from Firestore
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const selectedOrg = data.selectedOrg;

            // Get current website URL
            const currentUrl = window.location.href;

            // Encode the URL for Firestore
            const encodedUrl = encodeUrlForFirestore(currentUrl);

            // Create the note data
            const noteData = {
              text: noteText,
              user: user.uid, // Store the user UID
              date: new Date().toISOString(),
              websiteUrl: currentUrl, // Save the current website URL
              position: {
                x: selectionX,
                y: selectionY
              }
            };

            // Save the note to Firestore under the appropriate website
            const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
            await setDoc(websiteRef, {
              notes: arrayUnion(noteData)
            }, {merge : true});

            console.log('Note saved successfully');
          } else {
            console.error('User document does not exist');
            alert('User document not found.');
          }
        } catch (error) {
          console.error('Error saving note:', error);
          alert('An error occurred while saving the note.');
        }
      } else {
        alert('Please enter a note.');
      }
    });
  }
});

// Helper function to encode URLs for Firestore document IDs
function encodeUrlForFirestore(url) {
  return url.replace(/\//g, '_'); // Replace all slashes with underscores
}

async function loadNotesForCurrentWebsite(url) {
  console.log('Loading notes for website:', url);

  try {
    // Get User's "selectedOrg" from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const selectedOrg = data.selectedOrg;

      // Encode the URL for Firestore
      const encodedUrl = encodeUrlForFirestore(url);

      // Get the notes for the current website
      const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
      const websiteDoc = await getDoc(websiteRef);

      if (websiteDoc.exists()) {
        const websiteData = websiteDoc.data();
        const notes = websiteData.notes || [];

        // Render the notes on the page
        notes.forEach(note => {
          renderNote(note);
        });
      } else {
        console.log('No notes found for this website');
      }
    } else {
      console.error('User document does not exist');
    }
  } catch (error) {
    console.error('Error loading notes:', error);
    alert('An error occurred while loading the notes.');
  }
}

async function renderNote(note) {
  const { text, position } = note;
  const { x, y } = position;

  const user = note.user;
  const date = new Date(note.date).toLocaleString();
  var user_name = "Unknown User";

  const docRef = doc(db, "users", user);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('User data:', data);
    user_name = data.name;
  }


  // Create a note container
  const noteContainer = document.createElement('div');
  noteContainer.style.position = 'absolute';
  noteContainer.style.top = `${y}px`;
  noteContainer.style.left = `${x}px`;
  noteContainer.style.backgroundColor = '#ffffff';
  noteContainer.style.border = '1px solid #e0e0e0';
  noteContainer.style.padding = '15px';
  noteContainer.style.borderRadius = '8px';
  noteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  noteContainer.style.zIndex = '1000';
  noteContainer.style.width = '240px'; // Slightly wider for better spacing

  // Create note content
  const noteDisplay = document.createElement('div');
  noteDisplay.textContent = text;
  noteDisplay.style.fontSize = '14px';
  noteDisplay.style.color = '#333';
  noteContainer.appendChild(noteDisplay);

  // State user and date in in a smaller font on the bottom of the note
  const noteMeta = document.createElement('div');
  noteMeta.textContent = `By ${user_name} on ${date}`;
  noteMeta.style.fontSize = '12px';
  noteMeta.style.color = '#666';
  noteMeta.style.marginTop = '10px';
  noteContainer.appendChild(noteMeta);

  await handleReplyButton(noteContainer, note);
  document.body.appendChild(noteContainer);
}

async function handleReplyButton(noteContainer, note) {
  var replyButton = document.createElement('button');
  replyButton.textContent = 'Reply';
  replyButton.style.backgroundColor = '#007bff';
  replyButton.style.color = 'white';
  replyButton.style.border = 'none';
  replyButton.style.padding = '8px 16px';
  replyButton.style.cursor = 'pointer';
  replyButton.style.borderRadius = '4px';
  replyButton.style.fontSize = '14px';
  replyButton.style.transition = 'background-color 0.3s ease';
  replyButton.style.marginTop = '10px';

  replyButton.addEventListener('mouseenter', () => {
    replyButton.style.backgroundColor = '#0056b3';
  });

  replyButton.addEventListener('mouseleave', () => {
    replyButton.style.backgroundColor = '#007bff';
  });

  replyButton.addEventListener('click', () => {
    // Create a textarea for the reply input
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '80px';
    textarea.style.marginBottom = '10px';
    textarea.style.border = '1px solid #e0e0e0';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.placeholder = 'Add your reply...';
    noteContainer.appendChild(textarea);

    // the note object should have a "replies" array or if not create one
    if (!note.replies) {
      note.replies = [];
    } 

    // add a submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.style.backgroundColor = '#007bff';
    submitButton.style.color = 'white';
    submitButton.style.border = 'none';
    submitButton.style.padding = '8px 16px';
    submitButton.style.cursor = 'pointer';
    submitButton.style.borderRadius = '4px';
    submitButton.style.fontSize = '14px';
    submitButton.style.transition = 'background-color 0.3s ease';
    submitButton.style.marginTop = '10px';
    noteContainer.appendChild(submitButton);

    submitButton.addEventListener('mouseenter', () => {
      submitButton.style.backgroundColor = '#0056b3';
    });

    submitButton.addEventListener('mouseleave', () => {
      submitButton.style.backgroundColor = '#007bff';
    });

    submitButton.addEventListener('click', async () => {
      const replyText = textarea.value.trim();
      if (replyText) {
        const newReply = {
          text: replyText,
          user: user.uid,
          date: new Date().toISOString()
        };

        console.log('Reply:', newReply);
    
        // Update the note object locally
        if (!note.replies) {
          note.replies = [];
        }
        note.replies.push(newReply);
    
        // Update Firestore
        try {
          const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
          const selectedOrg = firebase_user.selectedOrg;
          console.log('Selected org:', selectedOrg);
          console.log('user:', user);
          console.log('Encoded URL:', encodedUrl);
          const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
    
          // Use arrayUnion to add the new reply
          await updateDoc(websiteRef, {
            notes: arrayUnion(note)
          });
    
          console.log('Reply added successfully');
        } catch (error) {
          console.error('Error updating Firestore:', error);
          alert('An error occurred while saving the reply.');
        }
      } else {
        alert('Please enter a reply.');
      }
    });

  });
  noteContainer.appendChild(replyButton);
}