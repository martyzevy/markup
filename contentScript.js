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
  button.innerHTML = 'TT';
  button.style.position = 'fixed';
  button.style.top = '10px';
  button.style.right = '10px';
  button.style.width = '40px';
  button.style.height = '40px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = 'white';
  button.style.color = '#007bff';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  button.style.zIndex = '1000';

  document.body.appendChild(button);
  button.addEventListener('click', () => {
    annotate = !annotate;
    if (annotate) {
      button.style.backgroundColor = '#007bff';
      button.style.color = 'white';
    } else{
      button.style.backgroundColor = 'white';
      button.style.color = '#007bff';
    }
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
    //line.style.left = `${selectionX}px`;
    line.style.width = `${noteX - selectionX}px`;
    line.style.height = '2px';
    line.style.backgroundColor = '#007bff';
    line.style.zIndex = '1000';
    line.style.opacity = '0.8';
    //line.style.transformOrigin = 'left';
    line.style.transform = 'scaleX(1)';
    line.style.transition = 'transform 0.3s ease';
    document.body.appendChild(line);

    // Create a note container on the right side of the screen
    const noteContainer = document.createElement('div');
    noteContainer.style.position = 'absolute';
    noteContainer.style.top = `${noteY}px`;
    noteContainer.style.left = `${noteX}px`; 
    noteContainer.style.backgroundColor = '#ffffff';
    noteContainer.style.border = '1px solid #e0e0e0';
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
    //closeButton.style.left = '5px';
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
    textarea.style.marginTop = '10px';
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

            // updare selectionX and selectionY
            var new_selectionX = rect.right;
            // make new_selectionX 10px from the right edge of the screen
            new_selectionX = window.innerWidth - 250;
            const new_selectionY = rect.top + window.scrollY;

            // Create the note data
            const noteData = {
              text: noteText,
              user: user.uid, // Store the user UID
              date: getFormattedDate(),
              websiteUrl: currentUrl, // Save the current website URL
              position: {
                x: new_selectionX,
                y: new_selectionY
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
  const noteContainer = await createNoteContainer(note);
  noteContainer.style.position = 'absolute';
  noteContainer.style.top = `${note.position.y}px`;
  noteContainer.style.left = `${window.innerWidth - 280}px`;
  noteContainer.style.backgroundColor = '#ffffff';
  noteContainer.style.border = '1px solid #e0e0e0';
  noteContainer.style.padding = '15px';
  noteContainer.style.borderRadius = '8px';
  noteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  noteContainer.style.zIndex = '1000';
  noteContainer.style.width = '240px'; 
  noteContainer.style.fontFamily = 'Arial, sans-serif';

  // Add likes and replies
  const likesSection = noteContainer.querySelector('.likes-section');
  const repliesContainer = noteContainer.querySelector('.replies-container');

  // Render likes
  const likesData = await getLikesData(note);
  renderLikes(likesSection, likesData, note);

  // Render replies
  if (note.replies) {
    note.replies.forEach(reply => {
      renderReply(repliesContainer, reply);
    });
  }

  // Add collapsible functionality
  const noteHeader = noteContainer.querySelector('.note-header');
  const noteContent = noteContainer.querySelector('.note-content');
  const collapseIcon = noteHeader.querySelector('.collapse-icon');

  noteHeader.addEventListener('click', () => {
    if (noteContent.style.display === 'none') {
      noteContent.style.display = 'block';
      collapseIcon.textContent = '▼';
    } else {
      noteContent.style.display = 'none';
      collapseIcon.textContent = '▶';
    }
  });

  // Append the note container to the body
  document.body.appendChild(noteContainer);
}

async function getUserFromUID(uid) {
  // Get the user data from Firestore using the UID
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().name;
  } else {
    console.error('User document does not exist');
  }
}

async function createNoteContainer(note) {
  const noteContainer = document.createElement('div');
  noteContainer.className = 'note-container';

  // Create header
  const noteHeader = document.createElement('div');
  noteHeader.className = 'note-header';
  const note_user = await getUserFromUID(note.user);
  noteHeader.innerHTML = `
    <h3>Note by ${note_user}</h3>
    <span class="collapse-icon">▼</span>
  `;
  noteContainer.appendChild(noteHeader);

  // Create content
  const noteContent = document.createElement('div');
  noteContent.className = 'note-content';
  noteContainer.appendChild(noteContent);

  // Add note text
  const noteText = document.createElement('div');
  noteText.className = 'note-text';
  noteText.textContent = note.text;
  noteText.style.fontSize = '16px';
  noteContent.appendChild(noteText);

  // Add note metadata
  const noteMeta = document.createElement('div');
  noteMeta.className = 'note-meta';
  noteMeta.textContent = `On ${note.date}`;
  noteContent.appendChild(noteMeta);

  // Add likes section
  const likesSection = document.createElement('div');
  likesSection.className = 'likes-section';
  noteContent.appendChild(likesSection);

  // Add replies container
  const repliesContainer = document.createElement('div');
  repliesContainer.className = 'replies-container';
  noteContent.appendChild(repliesContainer);

  // Add reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'reply-button';
  replyButton.textContent = 'Reply';
  noteContent.appendChild(replyButton);
  handleReplyButton(noteContainer, note);

  return noteContainer;
}

async function renderReply(repliesContainer, reply) {
  const replyDisplay = document.createElement('div');
  replyDisplay.className = 'reply';

  // Add reply text
  const replyText = document.createElement('div');
  replyText.className = 'reply-text';
  replyText.textContent = reply.text;
  replyDisplay.appendChild(replyText);

  // Add reply metadata
  const replyMeta = document.createElement('div');
  replyMeta.className = 'reply-meta';
  replyMeta.textContent = `By ${reply.user} on ${reply.date}`;
  replyDisplay.appendChild(replyMeta);

  // Append reply to the replies container
  repliesContainer.appendChild(replyDisplay);
}

async function handleReplyButton(noteContainer, note) {
  const replyButton = noteContainer.querySelector('.reply-button');
  const repliesContainer = noteContainer.querySelector('.replies-container');

  replyButton.addEventListener('click', () => {
    replyButton.disabled = true;
    // Create a textarea for the reply input
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add your reply...';
    textarea.style.marginBottom = '10px';
    textarea.style.marginTop = '10px';
    repliesContainer.appendChild(textarea);

    // Add a submit button
    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    repliesContainer.appendChild(submitButton);

    // Handle submit
    submitButton.addEventListener('click', async () => {
      const replyText = textarea.value.trim();
      replyButton.disabled = false;
      console.log('firebse_user:', firebase_user);
      if (replyText) {
        // Add reply logic here
        const newReply = {
          text: replyText,
          user: firebase_user.name,
          date: getFormattedDate(),
        };

        // Update Firestore and render the reply
        await addReplyToFirestore(note, newReply);
        renderReply(repliesContainer, newReply);

        // Clean up
        repliesContainer.removeChild(textarea);
        repliesContainer.removeChild(submitButton);
      }
    });
  });
}

async function addReplyToFirestore(note, reply) {
  try {
      const selectedOrg = firebase_user.selectedOrg;
      const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
      const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
      await getDoc(websiteRef);
      const websiteDoc = await getDoc(websiteRef);
      const notes = websiteDoc.data().notes || [];
      for (const n of notes) {
        if (n.text === note.text && n.position.x === note.position.x && n.position.y === note.position.y) {
          console.log('Note found:', n);
          n.replies = n.replies || [];
          n.replies.push(reply);
          await updateDoc(websiteRef, {
            notes: notes,
          }, {merge: true});
          console.log('Reply saved successfully');
          return;
        }
      }

      console.log('Note saved successfully');
    } catch (error) {
    console.error('Error saving note:', error);
    alert('An error occurred while saving the note.');
  }
} 

function renderLikes(likesSection, likesData, note) {
  // Clear existing likes section content
  likesSection.innerHTML = '';

  // Create a container for the like button and like count
  const likeContainer = document.createElement('div');
  likeContainer.className = 'like-container';
  likeContainer.style.display = 'flex';
  likeContainer.style.alignItems = 'center';
  likeContainer.style.backgroundColor = '#007bff';
  likeContainer.style.borderRadius = '4px';
  likeContainer.style.padding = '5px 10px';
  likeContainer.style.color = 'white';
  likesSection.appendChild(likeContainer);

  // Create the like button
  const likeButton = document.createElement('button');
  likeButton.innerHTML = '<i class="fas fa-thumbs-up"></i>';
  likeButton.style.backgroundColor = 'transparent';
  likeButton.style.color = 'white';
  likeButton.style.border = 'none';
  likeButton.style.padding = '0';
  likeButton.style.cursor = 'pointer';
  likeButton.style.fontSize = '14px';
  likeButton.style.transition = 'opacity 0.3s ease';
  likeButton.style.marginRight = '5px';
  likeContainer.appendChild(likeButton);

  // Create the like count
  const likeCount = document.createElement('span');
  likeCount.textContent = likesData.length;
  likeCount.style.fontSize = '14px';
  likeCount.style.color = 'white';
  likeContainer.appendChild(likeCount);

  // Add event listener for the like button
  likeButton.addEventListener('click', async () => {
    if (!likesData.includes(user.uid)) {
      likesData.push(user.uid);
    } else {
      likesData = likesData.filter((id) => id !== user.uid);
    }
    likeCount.textContent = likesData.length;

    // Update Firestore with the new likes data
    try {
      const encodedUrl = encodeUrlForFirestore(note.websiteUrl);
      const selectedOrg = firebase_user.selectedOrg;
      const websiteRef = doc(db, "organizations", selectedOrg, "websites", encodedUrl);
      const websiteDoc = await getDoc(websiteRef);

      if (websiteDoc.exists()) {
        const websiteData = websiteDoc.data();
        const notes = websiteData.notes || [];
        const noteIndex = notes.findIndex(
          (n) =>
            n.text === note.text &&
            n.position.x === note.position.x &&
            n.position.y === note.position.y
        );

        if (noteIndex !== -1) {
          notes[noteIndex].likes = likesData;
          await updateDoc(websiteRef, {
            notes: notes,
          });
          console.log('Likes updated successfully');
        }
      }
    } catch (error) {
      console.error('Error updating likes in Firestore:', error);
    }
  });
}

function injectStylesheet(url) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

injectStylesheet('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* General styles for the note container */
    .note-container {
      position: absolute;
      top: 0;
      right: 10px;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      width: 240px;
      font-family: Arial, sans-serif;
      margin-bottom: 20px; /* Add spacing between notes */
    }

    /* Styles for the note header */
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: 12px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 8px 8px 0 0;
      width: auto;
    }

    .note-header h3 {
      margin: 0;
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .collapse-icon {
      font-size: 12px;
      color: #666;
      transition: transform 0.3s ease;
    }

    /* Styles for the note content */
    .note-content {
      padding: 12px;
      transition: opacity 0.3s ease;
    }

    /* Styles for the note text */
    .note-text {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    /* Styles for the note metadata */
    .note-meta {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }

    /* Styles for the likes section */
    .likes-section {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }

    .like-container {
      display: flex;
      align-items: center;
      background-color: #007bff;
      border-radius: 4px;
      padding: 5px 10px;
      color: white;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .like-container:hover {
      background-color: #0056b3;
    }

    .like-container button {
      background-color: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      margin-right: 5px;
    }

    .like-container span {
      font-size: 14px;
      color: white;
    }

    /* Styles for the replies container */
    .replies-container {
      margin-top: 10px;
    }

    /* Styles for individual replies */
    .reply {
      background-color: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 10px;
      margin-top: 10px;
    }

    .reply-text {
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }

    .reply-meta {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    /* Styles for the reply button */
    .reply-button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      transition: background-color 0.3s ease;
      width: 100%;
      margin-top: 10px;
    }

    .reply-button:hover {
      background-color: #0056b3;
    }

    /* Styles for the textarea */
    textarea {
      width: 100%;
      height: 80px;
      margin-bottom: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 8px;
      font-size: 14px;
      resize: none;
      font-family: Arial, sans-serif;
    }

    textarea:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .note-container  {
      right: 10px;
    }
  `;
  document.head.appendChild(style);
}

injectStyles();

function getFormattedDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2); 
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');

  if (hours > 12) {
    hours = hours - 12;
    minutes = minutes + ' PM';
  } else{
    minutes = minutes + ' AM';
  }

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  if (request.action === 'changeSelectedOrg') {
    console.log('changeSelectedOrg in contentScript.js');

    window.location.reload();

    // Send a response back to the popup
    sendResponse({ success: true });

    // Reload the page (if necessary)
    // location.reload();

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});