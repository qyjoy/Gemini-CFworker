// Helper Function for CORS Headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Helper Function for HTML Rendering
function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>AI Model Demo via Cloudflare</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    #chat-container { max-height: 60vh; overflow-y: auto; }
    #chat > div { margin-bottom: 1rem; padding: 0.75rem; border-radius: 0.5rem; max-width: 90%; word-break: break-word; line-height: 1.6; }
    .user-message { background-color: #1e40af; color: white; align-self: flex-end; margin-left: 10%; }
    .ai-message { background-color: #374151; color: white; align-self: flex-start; margin-right: 10%; white-space: pre-wrap; }
    .ai-message img { display: block; max-width: 100%; max-height: 400px; height: auto; margin-top: 0.75rem; border-radius: 0.375rem; background-color: #4b5563; }
    .ai-message strong, .user-message strong { display: block; margin-bottom: 0.25rem; font-weight: bold; color: #9ca3af; }
    .error-message { background-color: #b91c1c; color: white; }
    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; margin-left: 8px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    textarea { scrollbar-width: thin; scrollbar-color: #4b5563 #374151; }
  </style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen flex flex-col items-center p-4 font-sans">
  <h1 class="text-3xl font-bold my-6 text-center">AI Model Demo</h1>
  <p class="text-gray-400 mb-6 text-center">通过 Cloudflare Worker 代理 (需要配置 API Key)</p>

  <div class="w-full max-w-3xl bg-gray-800 shadow-lg rounded-lg p-6">
    <div class="mb-4">
      <label for="model" class="block mb-2 text-sm font-medium text-gray-300">选择模型：</label>
      <select id="model" class="w-full p-2.5 rounded bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
        <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash Preview (文本)</option>
        <option value="imagen-3.0-generate-002">Imagen 3 (文生图)</option>

      </select>
    </div>
    <div class="mb-4">
      <label for="prompt" class="block mb-2 text-sm font-medium text-gray-300">输入你的内容或画面描述：</label>
      <textarea id="prompt" rows="3" class="w-full p-2.5 rounded bg-gray-700 border border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500 resize-y" placeholder="例如：一只穿着宇航服的猫漂浮在太空中，写实风格"></textarea>
    </div>
    <button id="sendBtn" class="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-white transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed">
      <span class="button-text">发送</span>
      <span id="sendIcon">&#10148;</span> <span id="loadingIcon" class="loader hidden"></span>
    </button>
    <div id="chat-container" class="mt-6 border-t border-gray-700 pt-4">

      <div id="chat" class="flex flex-col space-y-4">
        <div class="ai-message"><strong>AI:</strong> 你好！请选择一个模型并输入你的请求。</div>
      </div>
    </div>
  </div>
  <footer class="text-center text-gray-500 text-sm mt-8">
    请在 Worker 脚本中配置 API Key 后使用。
  </footer>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    console.log("DOM fully loaded and parsed.");
    const chat = document.getElementById('chat');
    const chatContainer = document.getElementById('chat-container');
    const sendBtn = document.getElementById('sendBtn');
    const promptTextarea = document.getElementById('prompt');
    const modelSelect = document.getElementById('model');
    const sendIcon = document.getElementById('sendIcon');
    const loadingIcon = document.getElementById('loadingIcon');
    const buttonText = sendBtn ? sendBtn.querySelector('.button-text') : null;

    if (!chat || !chatContainer || !sendBtn || !promptTextarea || !modelSelect || !sendIcon || !loadingIcon || !buttonText) {
      console.error("CRITICAL ERROR: One or more essential HTML elements not found.");
      alert("页面加载错误：无法找到必要的聊天界面元素。请检查HTML结构或稍后重试。");
      return;
    }
    console.log("All essential elements found.");

    function setLoadingState(isLoading) {
      console.log(`setLoadingState called with isLoading: ${isLoading}`);
      if (!sendBtn || !promptTextarea || !buttonText || !sendIcon || !loadingIcon) {
          console.error("Error inside setLoadingState: Required elements missing.");
          return;
      }
      try {
          sendBtn.disabled = isLoading;
          promptTextarea.disabled = isLoading;
          if (isLoading) {
              buttonText.textContent = "处理中...";
              sendIcon.classList.add('hidden');
              loadingIcon.classList.remove('hidden');
          } else {
              buttonText.textContent = "发送";
              sendIcon.classList.remove('hidden');
              loadingIcon.classList.add('hidden');
          }
          console.log("setLoadingState finished.");
      } catch (e) {
          console.error("Error executing setLoadingState:", e);
      }
    }

    function addMessage(text, sender = 'ai', isLoading = false) {
      console.log(`addMessage called. Sender: ${sender}, isLoading: ${isLoading}`);
      if (!chat || !modelSelect) {
          console.error("Error inside addMessage: Chat or modelSelect element not found.");
          return null;
      }
      let messageDiv = null;
      try {
          messageDiv = document.createElement('div');
          messageDiv.classList.add(sender === 'user' ? 'user-message' : 'ai-message');

          const senderStrong = document.createElement('strong');
          senderStrong.textContent = sender === 'user' ? '你:' : 'AI:';
          const contentSpan = document.createElement('span');
          contentSpan.className = 'response-content';

          messageDiv.appendChild(senderStrong);

          if (isLoading) {
              const thinkingSpan = document.createElement('span');
              thinkingSpan.className = 'thinking';
              thinkingSpan.textContent = ' 思考中...';
              messageDiv.appendChild(thinkingSpan);
              messageDiv.appendChild(contentSpan);
          } else {
              if (sender === 'user') {
                  contentSpan.textContent = text;
              } else {
                   if (modelSelect.value.startsWith('imagen') && (text.includes('<img') || text.includes('data:image'))) {
                       contentSpan.innerHTML = text;
                   } else {
                       contentSpan.textContent = text;
                   }
              }
              messageDiv.appendChild(contentSpan);
          }

          chat.appendChild(messageDiv);
          console.log("Message added to chat.");
          scrollToBottom();
          return messageDiv;
      } catch (e) {
          console.error("Error executing addMessage:", e);
          return messageDiv;
      }
    }

    function scrollToBottom() {
       try {
          if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
          } else {
              console.error("Error scrolling: chatContainer not found.");
          }
       } catch (e) {
          console.error("Error executing scrollToBottom:", e);
       }
    }

    function escapeHTML(str) {
      if (typeof str !== 'string') return '';
      const p = document.createElement('p');
      p.appendChild(document.createTextNode(str));
      return p.innerHTML;
    }

    function autoResizeTextarea() {
      try {
          if (promptTextarea) {
              promptTextarea.style.height = 'auto';
              promptTextarea.style.height = Math.min(promptTextarea.scrollHeight, 200) + 'px';
          } else {
              console.error("Error resizing textarea: promptTextarea not found.");
          }
      } catch (e) {
          console.error("Error executing autoResizeTextarea:", e);
      }
    }

    async function handleSend() {
      console.log("handleSend function started.");
      let aiMessageDiv = null;
      let responseContentSpan = null;
      try {
        const prompt = promptTextarea.value.trim();
        const model = modelSelect.value;
        console.log(`Prompt: "${prompt}", Model: "${model}"`);

        if (!prompt) {
          console.log("Prompt is empty. Alerting user.");
          alert("请输入你的内容或画面描述！");
          promptTextarea.focus();
          return;
        }

        console.log("Setting loading state to true.");
        setLoadingState(true);

        console.log("Adding user message.");
        addMessage(prompt, 'user');
        promptTextarea.value = '';
        autoResizeTextarea();

        console.log("Adding AI placeholder message.");
        aiMessageDiv = addMessage('', 'ai', true);
        if (!aiMessageDiv) {
            throw new Error("Failed to create AI placeholder message element.");
        }
        responseContentSpan = aiMessageDiv.querySelector('.response-content');
        const thinkingSpan = aiMessageDiv.querySelector('.thinking');
        if (!responseContentSpan) {
             throw new Error("Failed to find response content span in AI placeholder.");
        }
        console.log("AI placeholder added.");

        console.log("Initiating fetch request to worker:", location.href);
        const res = await fetch(location.href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, model })
        });
        console.log(`Workspace response received. Status: ${res.status}, ok: ${res.ok}`);

        if (thinkingSpan) thinkingSpan.remove();

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Worker/API Error Response (Status ${res.status}):`, errorText);
          if (responseContentSpan && aiMessageDiv) {
              responseContentSpan.textContent = `请求出错 (${res.status}): ${escapeHTML(errorText.substring(0, 500))}${errorText.length > 500 ? '...' : ''}`;
              aiMessageDiv.classList.add('error-message');
              scrollToBottom();
          } else {
               console.error("Cannot display fetch error in chat: message elements not found.");
          }
          throw new Error(`Server responded with status ${res.status}`);
        }

        const selectedModelType = model.startsWith("imagen") ? "imagen" : "gemini";
        console.log(`Handling response for model type: ${selectedModelType}`);

        if (selectedModelType === "gemini") {
            console.log("Processing Gemini SSE stream...");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentText = '';
            let loopCount = 0;

            while (loopCount < 10000) {
                loopCount++;
                const { done, value } = await reader.read();
                if (done) {
                    console.log("SSE stream finished (done is true).");
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6).trim();
                        if (jsonStr === '[DONE]' || !jsonStr) continue;

                        try {
                            const chunk = JSON.parse(jsonStr);
                            const textPart = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (textPart) {
                                currentText += textPart;
                                responseContentSpan.textContent = currentText;
                                scrollToBottom();
                            } else {
                                console.log("Received non-text chunk or unexpected structure:", chunk);
                                if (chunk.promptFeedback?.blockReason) {
                                    currentText += `\n[内容被阻止: ${chunk.promptFeedback.blockReason}]`;
                                    responseContentSpan.textContent = currentText;
                                    aiMessageDiv.classList.add('error-message');
                                    scrollToBottom();
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing streaming JSON chunk:", e, "Chunk:", jsonStr);
                            currentText += '\\n[解析数据块时出错]';
                            responseContentSpan.textContent = currentText;
                            scrollToBottom();
                        }
                    } else if (line.trim()) {
                        console.log("Received non-data SSE line:", line);
                    }
                }
            }

            if (loopCount >= 10000) console.warn("SSE loop safety break triggered.");
            if (buffer.trim()) {
              console.warn("Processing remaining buffer after stream end:", buffer);
              if (buffer.startsWith('data: ')) {
                  const jsonStr = buffer.substring(6).trim();
                  try {
                       const chunk = JSON.parse(jsonStr);
                       const textPart = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                       if (textPart) {
                           currentText += textPart;
                           responseContentSpan.textContent = currentText;
                           scrollToBottom();
                       }
                   } catch (e) {
                       console.error("Error parsing final buffer:", e);
                       currentText += '\\n[处理流末尾数据时出错]';
                       responseContentSpan.textContent = currentText;
                       scrollToBottom();
                   }
               } else {
                   console.log("Final buffer does not start with 'data:', content:", buffer);
               }
            }
            console.log("Gemini SSE processing finished.");
        } else if (selectedModelType === "imagen") {
          console.log("Processing Imagen JSON response...");
          try {
              const data = await res.json();
              console.log("Imagen response JSON parsed:", data);

              if (data.images && data.images.length > 0) {
                  console.log(`Found ${data.images.length} images.`);
                  responseContentSpan.innerHTML = data.images.map((imgSrc, index) =>
                      `<img src="${imgSrc}" class="my-2 rounded shadow-md" alt="Generated image ${index + 1}" loading="lazy"/>`
                  ).join('');
              } else {
                  const message = data.message || (data.promptFeedback?.blockReason ? `请求被阻止: ${data.promptFeedback.blockReason}` : "未生成任何图像或收到意外响应。");
                  console.log("No images found or message received:", message);
                  responseContentSpan.textContent = escapeHTML(message);
                  if (message.includes("Blocked") || message.includes("Error") || message.includes("出错") || message.includes("Unexpected") || message.includes("阻止")) {
                      aiMessageDiv.classList.add('error-message');
                  }
              }
              scrollToBottom();
          } catch (e) {
              console.error("Error parsing Imagen JSON response:", e);
              if(responseContentSpan && aiMessageDiv){
                 responseContentSpan.textContent = '解析图像响应时出错：' + e.message;
                 aiMessageDiv.classList.add('error-message');
                 scrollToBottom();
              }
              throw new Error('Failed to parse Imagen JSON: ' + e.message);
          }
          console.log("Imagen JSON processing finished.");
        }

        console.log("handleSend processing completed successfully.");
      } catch (error) {
        console.error("!!!! CLIENT-SIDE CATCH BLOCK ERROR in handleSend !!!!:", error);
        if (responseContentSpan) {
            if (!responseContentSpan.textContent.includes("出错")) {
                 responseContentSpan.textContent = '客户端错误: ' + error.message;
            }
            if (aiMessageDiv && !aiMessageDiv.classList.contains('error-message')) {
                aiMessageDiv.classList.add('error-message');
            }
            scrollToBottom();
        } else {
            console.error("Cannot display error in chat bubble: responseContentSpan not found.");
        }

      } finally {
        console.log("!!!! CLIENT-SIDE FINALLY BLOCK in handleSend !!!!");
        setLoadingState(false);
        promptTextarea.focus();
        console.log("UI re-enabled.");
      }
    }

    sendBtn.addEventListener('click', handleSend);
    console.log("Send button click listener attached.");

    promptTextarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        console.log("Enter key pressed, triggering handleSend.");
        handleSend();
      }
    });
    console.log("Textarea keypress listener attached.");

    promptTextarea.addEventListener('input', autoResizeTextarea);
    console.log("Textarea input listener attached.");

    autoResizeTextarea();
    console.log("Initial textarea resize done.");

  });
</script>

</body>
</html>
  `;
}

export default {
  async fetch(request, env, ctx) {
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID();
    const logPrefix = `[${requestId}]`;

    console.log(`${logPrefix} Worker received request: ${request.method} ${request.url}`);
    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
         console.error(`${logPrefix} CRITICAL ERROR: API Key is not configured in environment variables.`);
         return new Response("Server Configuration Error: API Key not configured.", {
             status: 500,
             headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
         });
    }

    if (request.method === "OPTIONS") {
      console.log(`${logPrefix} Responding to OPTIONS request.`);
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method === "GET") {
      console.log(`${logPrefix} Responding to GET request with HTML.`);
      try {
          const html = renderHTML();
          return new Response(html, {
            headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
          });
      } catch (e) {
          console.error(`${logPrefix} Error rendering HTML:`, e);
          return new Response("Internal Server Error rendering page.", { status: 500 });
      }
    }

    if (request.method === "POST") {
      console.log(`${logPrefix} Processing POST request.`);
      let requestBody;
      try {
        requestBody = await request.json();
        console.log(`${logPrefix} Parsed request body. Model: ${requestBody?.model}, Prompt starts with: ${String(requestBody?.prompt).substring(0,30)}...`);
      } catch (e) {
        console.error(`${logPrefix} Invalid JSON body received:`, e);
        return new Response("Invalid JSON body.", {
          status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
        });
      }

      const { prompt, model } = requestBody;
      if (!prompt || !model) {
        console.error(`${logPrefix} Missing prompt or model in request body.`);
        return new Response("Missing prompt or model in request body.", {
          status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
        });
      }

      const allowedModels = ["imagen-3.0-generate-002", "gemini-2.5-flash-preview-04-17"];
      if (!allowedModels.includes(model)) {
        console.error(`${logPrefix} Invalid model selected: ${model}`);
        return new Response(`Invalid model selected: ${model}. Allowed: ${allowedModels.join(", ")}`, {
          status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
        });
      }

      const isImagen = model.startsWith("imagen");
      const apiEndpoint = isImagen ? 'generateContent' : 'streamGenerateContent';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model:${apiEndpoint}?key=${GEMINI_API_KEY}${isImagen ? '' : '&alt=sse'}`;
      console.log(`${logPrefix} Target API URL: ${apiUrl.replace(GEMINI_API_KEY, '***API_KEY***')}`);

      const apiRequestBody = isImagen
        ? { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { candidateCount: 1 } }
        : { contents: [{ parts: [{ text: prompt }] }] };

      try {
        console.log(`${logPrefix} Sending request to Google API...`);
        const apiResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiRequestBody)
        });
        console.log(`${logPrefix} Google API response status: ${apiResponse.status}, ok: ${apiResponse.ok}`);

        if (!apiResponse.ok) {
          const errorBodyText = await apiResponse.text();
          console.error(`${logPrefix} Google API Error (${apiResponse.status}): ${errorBodyText}`);
          let userFriendlyError = `Google API Error (${apiResponse.status})`;
           try {
               const errorJson = JSON.parse(errorBodyText);
               userFriendlyError += `: ${errorJson.error?.message || 'Unknown error structure.'}`;
           } catch (e) {
               userFriendlyError += `: ${errorBodyText.substring(0, 200)}${errorBodyText.length > 200 ? "..." : ""}`;
           }

           if (isImagen) {
                return new Response(JSON.stringify({ images: [], message: userFriendlyError }), {
                    status: apiResponse.status,
                    headers: { "Content-Type": "application/json", ...corsHeaders() }
                });
            } else {
                return new Response(userFriendlyError, {
                    status: apiResponse.status,
                    headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
                });
            }
        }

        if (isImagen) {
          console.log(`${logPrefix} Processing successful Imagen response.`);
          const responseBodyText = await apiResponse.text();
          let data;
          try {
              data = JSON.parse(responseBodyText);
              console.log(`${logPrefix} Parsed Imagen JSON successfully. Candidates count: ${data.candidates?.length}`);
          } catch (parseError) {
              console.error(`${logPrefix} Error parsing Imagen JSON response:`, parseError, "Body snippet:", responseBodyText.substring(0, 500));
              return new Response(JSON.stringify({ images: [], message: "Internal Server Error: Failed to parse Imagen API response." }), {
                   status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() }
               });
          }

          if (data.promptFeedback?.blockReason) {
               console.warn(`${logPrefix} Imagen request blocked: ${data.promptFeedback.blockReason}`);
               return new Response(JSON.stringify({ images: [], message: `请求被阻止: ${data.promptFeedback.blockReason}` }), {
                   status: 200,
                   headers: { "Content-Type": "application/json", ...corsHeaders() }
               });
          }
          if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts) {
                console.warn(`${logPrefix} Imagen response ok, but no valid candidates/parts found.`);
                return new Response(JSON.stringify({ images: [], message: "API success, but no generated images found in response." }), {
                     status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() }
                 });
          }

          const imageUrls = data.candidates[0].content.parts
                .filter(part => part.inlineData?.mimeType?.startsWith("image/"))
                .map(part => `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          if (imageUrls.length > 0) {
              console.log(`${logPrefix} Found ${imageUrls.length} images. Sending JSON response.`);
              return new Response(JSON.stringify({ images: imageUrls }), {
                  headers: { "Content-Type": "application/json", ...corsHeaders() }
              });
          } else {
              console.warn(`${logPrefix} Imagen response ok and candidates exist, but no image parts found.`);
              return new Response(JSON.stringify({ images: [], message: "API success, but no image data found in response parts." }), {
                  status: 200, headers: { "Content-Type": "application/json", ...corsHeaders() }
               });
          }

        } else {
          console.log(`${logPrefix} Streaming Gemini response back to client.`);
          const { readable, writable } = new TransformStream();
          apiResponse.body.pipeTo(writable).catch(err => {
               console.error(`${logPrefix} Error piping Gemini stream:`, err);
           });
          const responseHeaders = new Headers({
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders()
          });
          return new Response(readable, {
            status: 200,
            headers: responseHeaders
          });
        }

      } catch (error) {
        console.error(`${logPrefix} Worker fetch error calling Google API:`, error);
        const errorMsg = `Internal Server Error calling Google API: ${error.message}`;
        if (isImagen) {
              return new Response(JSON.stringify({ images: [], message: errorMsg }), {
                  status: 500, headers: { "Content-Type": "application/json", ...corsHeaders() }
              });
          } else {
              return new Response(errorMsg, {
                  status: 500, headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() }
              });
          }
      }
    }

    console.log(`${logPrefix} Method Not Allowed: ${request.method}`);
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { "Allow": "GET, POST, OPTIONS", ...corsHeaders() }
    });
  }
};