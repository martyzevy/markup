var annotate = false;

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
  }
});

createHighlighterButton();