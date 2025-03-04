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
      replyButton.disabled = true;
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

        // Clean up the UI
        noteContainer.removeChild(textarea);
        noteContainer.removeChild(submitButton);

        // Re-enable the reply button
        replyButton.disabled = false;

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
              },
              likes: [],
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

async function getLikesData(note) {
  // Get the updated likes count from Firestore by fetching the note
  const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
  const selectedOrg = firebase_user.selectedOrg;
  const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
  const websiteDoc = await getDoc(websiteRef);
  const noteText = note.text;
  const notePisition = note.position;
    if (websiteDoc.exists()) {
      const websiteData = websiteDoc.data();
      const notes = websiteData.notes || [];
      for (const n of notes) {
        if (n.text === noteText && n.position.x === notePisition.x && n.position.y === notePisition.y) {
          console.log('Note found:', n);
          console.log('Likes:', n.likes);
          return n.likes || [];
        }
      }
      return notes;
  }
}

async function renderNote(note) {
  const { text, position } = note;
  const { x, y } = position;

  var likesData = await getLikesData(note);

  const user = note.user;
  const date = new Date(note.date).toLocaleString();
  let user_name = "Unknown User";

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

  // State user and date in a smaller font on the bottom of the note
  const noteMeta = document.createElement('div');
  noteMeta.textContent = `By ${user_name} on ${date}`;
  noteMeta.style.fontSize = '12px';
  noteMeta.style.color = '#666';
  noteMeta.style.marginTop = '10px';
  noteContainer.appendChild(noteMeta);

  // Add a section to display likes on the note
  const likesSection = document.createElement('div');
  likesSection.style.display = 'flex';
  likesSection.style.alignItems = 'center';
  likesSection.style.marginTop = '10px';

  // Create a container for the like button and like count
  const likeContainer = document.createElement('div');
  likeContainer.style.display = 'flex';
  likeContainer.style.alignItems = 'center';
  likeContainer.style.backgroundColor = '#007bff'; // Blue background
  likeContainer.style.borderRadius = '4px'; // Rounded corners
  likeContainer.style.padding = '5px 10px'; // Padding for spacing
  likeContainer.style.color = 'white'; // Text color for like count

  // Add a like button
  const likeButton = document.createElement('button');
  likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
  likeButton.style.backgroundColor = 'transparent'; // Transparent background
  likeButton.style.color = 'white'; // White icon
  likeButton.style.border = 'none';
  likeButton.style.padding = '0';
  likeButton.style.cursor = 'pointer';
  likeButton.style.fontSize = '14px';
  likeButton.style.transition = 'opacity 0.3s ease';
  likeButton.style.marginRight = '5px'; // Space between button and count

  // Add hover effect for the like button
  likeButton.addEventListener('mouseenter', () => {
    likeButton.style.opacity = '0.8';
  });
  likeButton.addEventListener('mouseleave', () => {
    likeButton.style.opacity = '1';
  });

  // Add a like count
  const likeCount = document.createElement('span');
  if (!note.likes) {
    console.log('No likes found for note:', note);
    note.likes = [];
  }
  likeCount.textContent = likesData.length; // Default to 0 if no likes
  likeCount.style.fontSize = '14px';
  likeCount.style.color = 'white'; // White text for like count

  // Append the like button and like count to the container
  likeContainer.appendChild(likeButton);
  likeContainer.appendChild(likeCount);

  // Append the like container to the likes section
  likesSection.appendChild(likeContainer);

  // Add a like button event listener
  likeButton.addEventListener('click', async () => {
    // Append the user ID to the note.likes array if it doesn't already exist
    console.log('like button clicked');
    if (!likesData.includes(user)) {
      likesData.push(user);
      console.log('likesData after push:', likesData);
    } else {
      // Remove the user ID from the note.likes array
      likesData = likesData.filter(e => e !== user);
      console.log('likesData after filter:', likesData);
    }

    // Update the like count
    likeCount.textContent = likesData.length;

    // Update the note in Firestore
    try {
      const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
      const selectedOrg = firebase_user.selectedOrg;
      const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
    
      const websiteDoc = await getDoc(websiteRef);
      if (websiteDoc.exists()) {
        const websiteData = websiteDoc.data();
        const notes = websiteData.notes || [];
    
        // Find the index of the note to update
        const noteIndex = notes.findIndex(
          (n) =>
            n.text === note.text &&
            n.position.x === note.position.x &&
            n.position.y === note.position.y
        );
    
        if (noteIndex !== -1) {
          // Update the likes for the specific note
          notes[noteIndex].likes = likesData;
    
          // Update the entire notes array in Firestore
          await updateDoc(websiteRef, {
            notes: notes,
          });
    
          console.log('Note updated successfully');
        } else {
          console.log('Note not found');
        }
      }
    } catch (error) {
      console.error('Error updating Firestore:', error);
      alert('An error occurred while updating the note.');
    }
  });

  // Append the likes section to the note container
  noteContainer.appendChild(likesSection);

  // Append any replies to the note
  if (note.replies) {
    note.replies.forEach(reply => {
      renderReply(noteContainer, reply);
    });
  }

  await handleReplyButton(noteContainer, note);
  document.body.appendChild(noteContainer);
}

async function renderReply(noteContainer, reply) {
  const replyDisplay = document.createElement('div');
  replyDisplay.textContent = reply.text;
  replyDisplay.style.backgroundColor = '#f9f9f9';
  replyDisplay.style.border = '1px solid #e0e0e0';
  replyDisplay.style.padding = '10px';
  replyDisplay.style.borderRadius = '4px';
  replyDisplay.style.marginTop = '10px';
  replyDisplay.style.fontSize = '14px';
  replyDisplay.style.color = '#333';

  // say the user who replied and when
  const reply_user_id = reply.user;
  var reply_user = "";
  const docRef = doc(db, "users", reply_user_id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log('User data:', data);
    reply_user = data.name;
  }
  const reply_date = new Date(reply.date).toLocaleString();

  const replyMeta = document.createElement('div');
  replyMeta.textContent = `By ${reply_user} on ${reply_date}`;
  replyMeta.style.fontSize = '12px';
  replyMeta.style.color = '#666';
  replyMeta.style.marginTop = '10px';
  replyDisplay.appendChild(replyMeta);
  noteContainer.appendChild(replyDisplay);
}

async function handleReplyButton(noteContainer, note) {
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
  replyButton.style.marginTop = '10px';

  replyButton.addEventListener('mouseenter', () => {
    replyButton.style.backgroundColor = '#0056b3';
  });

  replyButton.addEventListener('mouseleave', () => {
    replyButton.style.backgroundColor = '#007bff';
  });

  replyButton.addEventListener('click', () => {
    // Disable the reply button to prevent multiple clicks
    replyButton.disabled = true;

    // Create a textarea for the reply input
    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '80px';
    textarea.style.marginBottom = '10px';
    textarea.style.border = '1px solid #e0e0e0';
    textarea.style.borderRadius = '4px';
    textarea.style.padding = '8px';
    textarea.style.marginTop = '10px';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.placeholder = 'Add your reply...';
    noteContainer.appendChild(textarea);

    // Add a submit button
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

    // Handle submit button click
    const handleSubmit = async () => {
      const replyText = textarea.value.trim();
      if (!replyText) {
        alert('Please enter a reply.');
        return;
      }

      // Create the reply object
      const newReply = {
        text: replyText,
        user: user.uid,
        date: new Date().toISOString(),
      };

      // Update the note object locally
      if (!note.replies) {
        note.replies = [];
      }
      note.replies.push(newReply);


      // Update Firestore
      try {
        const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
        const selectedOrg = firebase_user.selectedOrg;
        const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);

        // Use arrayUnion to add the new reply 
        await updateDoc(websiteRef, {
          notes: arrayUnion(note),
        });

        console.log('Reply added successfully');
      } catch (error) {
        console.error('Error updating Firestore:', error);
        alert('An error occurred while saving the reply.');
      }

      // Render the reply in the UI
      const replyDisplay = document.createElement('div');
      replyDisplay.textContent = replyText;
      replyDisplay.style.backgroundColor = '#f9f9f9';
      replyDisplay.style.border = '1px solid #e0e0e0';
      replyDisplay.style.padding = '10px';
      replyDisplay.style.borderRadius = '4px';
      replyDisplay.style.marginTop = '10px';
      replyDisplay.style.fontSize = '14px';
      replyDisplay.style.color = '#333';

      // Add metadata (user and date)
      const replyMeta = document.createElement('div');
      replyMeta.textContent = `By ${firebase_user.name} on ${new Date().toLocaleString()}`;
      replyMeta.style.fontSize = '12px';
      replyMeta.style.color = '#666';
      replyMeta.style.marginTop = '10px';
      replyDisplay.appendChild(replyMeta);
      noteContainer.appendChild(replyDisplay);

      // Clean up the UI
      noteContainer.removeChild(textarea);
      noteContainer.removeChild(submitButton);

      // Re-enable the reply button
      replyButton.disabled = false;
    };

    // Add event listener for the submit button
    submitButton.addEventListener('click', handleSubmit);
  });

  // Append the reply button to the note container
  noteContainer.appendChild(replyButton);
}

function injectStylesheet(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

injectStylesheet('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');