const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input"); // Make sure this exists in HTML
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileUploadButton = document.querySelector("#file-upload");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

// API Setup
const API_KEY = "AIzaSyDyglsUpBs_ZM-QQQgbJ8sQcK8YIDo-dWw"; // Replace with actual key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Track user input
const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null
  }
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

const scrollToBottom = () => {
  chatBody.scrollTop = chatBody.scrollHeight;
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const formatBotResponse = (text) => {
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "$1");
  text = text.replace(/- /g, "• ");
  return text.split("\n").map(p => `<p>${p.trim()}</p>`).join("");
};

const generateBotResponse = async (thinkingIndicator) => {
  try {
    const requestBody = {
      contents: chatHistory
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error(`${response.status} - Invalid API Key`);

    const data = await response.json();
    let botMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't get that.";
    botMessage = formatBotResponse(botMessage);

    chatBody.removeChild(thinkingIndicator);
    const botResponseDiv = createMessageElement(`<div class="message-text">${botMessage}</div>`, "bot-message");
    chatBody.appendChild(botResponseDiv);
  } catch (error) {
    chatBody.removeChild(thinkingIndicator);
    const errorDiv = createMessageElement(`<div class="message-text">🚫 <strong>Error:</strong> ${error.message}</div>`, "bot-message");
    chatBody.appendChild(errorDiv);
  } finally {
    userData.file = { data: null, mime_type: null };
    fileUploadWrapper.classList.remove("file-upload");

    const previewImg = fileUploadWrapper.querySelector("img");
    if (previewImg) {
      previewImg.src = "";
      previewImg.style.display = "none";
    }

    scrollToBottom();
  }
};

const handleOutgoingMessage = () => {
  userData.message = messageInput.value.trim();
  if (!userData.message) return;

  const previewImg = fileUploadWrapper.querySelector("img");

  const userMessageHTML = `
    <div class="message-text">${userData.message}</div>
    ${userData.file.data ? `<img src="${previewImg?.src}" class="attachment"/>` : ""}
  `;

  const userMessageDiv = createMessageElement(userMessageHTML, "user-message");
  chatBody.appendChild(userMessageDiv);

  // Push to chat history BEFORE sending to API
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data ? [{ inline_data: userData.file }] : [])
    ]
  });

  messageInput.value = "";

  const thinkingIndicator = createMessageElement(`
    <i class="bi bi-robot"></i>
    <div class="message-text">
      <div class="thinking-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`, "bot-message", "thinking");
  chatBody.appendChild(thinkingIndicator);

  scrollToBottom();
  generateBotResponse(thinkingIndicator);
};

// Event Listeners
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleOutgoingMessage();
  }
});

messageInput.addEventListener("input", () => {
  messageInput.style.height = `${initialInputHeight}px`;
  messageInput.style.height = `${messageInput.scrollHeight}px`;

  document.querySelector(".chat-form").style.borderRadius =
    messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});

sendMessageButton.addEventListener("click", handleOutgoingMessage);

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64Data = e.target.result.split(",")[1];
    const previewImg = fileUploadWrapper.querySelector("img");

    previewImg.src = e.target.result;
    previewImg.style.display = "block";
    fileUploadWrapper.classList.add("file-upload");

    userData.file = {
      data: base64Data,
      mime_type: file.type
    };

    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = { data: null, mime_type: null };
  fileUploadWrapper.classList.remove("file-upload");

  const previewImg = fileUploadWrapper.querySelector("img");
  if (previewImg) {
    previewImg.src = "";
    previewImg.style.display = "none";
  }

  fileInput.value = "";
});

fileUploadButton.addEventListener("click", () => fileInput.click());

// Emoji Picker Setup
const picker = new EmojiMart.Picker({
  theme: "light",
  skinTonePosition: "none",
  previewPosition: "none",
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, "end");
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === "emoji-picker") {
      document.body.classList.toggle("show-emoji-picker");
    } else {
      document.body.classList.remove("show-emoji-picker");
    }
  }
});

const emojiContainer = document.createElement("div");
emojiContainer.className = "emoji-picker-wrapper";
emojiContainer.appendChild(picker);
document.querySelector(".chat-form").appendChild(emojiContainer);

chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);

closeChatbot.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
