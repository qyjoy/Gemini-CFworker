# Gemini-CFworker
![45DEDC7B-B31F-461C-B786-12FBAF1A5391](https://github.com/user-attachments/assets/46ccd556-3d67-465e-aee8-5f8b3c0c13ef)

🌐 A simple Cloudflare Worker - Serverless &amp; Cost-Effective: No need to rent or manage your own server. Cloudflare Workers operate on a serverless model, and the free tier is often sufficient for personal use

Cloudflare Worker AI Proxy
🌐 A simple Cloudflare Worker to proxy requests to Google's Gemini and Imagen APIs. This allows you to run generative AI models on the edge, bypassing potential client-side restrictions and managing API keys securely using Cloudflare's environment variables.

🌐 一个简单的Cloudflare Worker，用于代理请求到Google的Gemini和Imagen API。这使得您可以在边缘运行生成式AI模型，绕过潜在的客户端限制，并使用Cloudflare的环境变量安全地管理API密钥。

✨ Features | ✨ 功能
Proxy AI Requests: Securely route requests to Google's Gemini and Imagen APIs.
代理AI请求： 安全地将请求路由到Google的Gemini和Imagen API。
API Key Management: Store your API key securely in Cloudflare Worker environment variables, not in the code.
API密钥管理： 将您的API密钥安全地存储在Cloudflare Worker环境变量中，而不是代码中。
Simple HTML Interface: Includes a basic HTML front-end for easy interaction and testing.
简单的HTML界面： 包含一个基本的HTML前端，方便交互和测试。
CORS Handling: Configured to handle Cross-Origin Resource Sharing.
CORS处理： 配置了处理跨域资源共享（CORS）。
Supports Streaming: Handles streaming responses from models like Gemini.
支持流式传输： 支持从Gemini等模型获取流式响应。
Supports Image Generation: Handles image generation responses from Imagen.
支持图像生成： 支持从Imagen获取图像生成响应。
👍 Advantages of using Cloudflare Worker | 👍 使用Cloudflare Worker的优点
Deploying this AI proxy on Cloudflare Workers offers several key advantages:
![Screenshot 2025-04-26 193722](https://github.com/user-attachments/assets/5a7e448a-222c-41d0-9a57-4fc0decc14c9)
在Cloudflare Workers上部署这个AI代理提供了几个主要优势：
Serverless & Cost-Effective: No need to rent or manage your own server. Cloudflare Workers operate on a serverless model, and the free tier is often sufficient for personal use.
无服务器且经济高效： 无需租用或管理自己的服务器。Cloudflare Workers采用无服务器模型，并且免费套餐通常足以满足个人使用需求。
No VPN Required for Access: For users in regions where direct access to Google APIs might be restricted, deploying the proxy on Cloudflare's global network can provide accessibility without the need for a VPN for the end-user.
访问无需翻墙： 对于某些地区可能无法直接访问Google API的用户，在Cloudflare的全球网络上部署代理可以让最终用户无需翻墙即可访问。
Edge Deployment: Workers run on Cloudflare's edge network, geographically closer to your users, potentially reducing latency.
边缘部署： Workers运行在Cloudflare的边缘网络上，地理位置更接近您的用户，从而可能减少延迟。
Scalability: Cloudflare automatically scales the Worker to handle varying levels of traffic.
可扩展性： Cloudflare会自动扩展Worker以处理不同级别的流量。
Ease of Deployment: Simple deployment process directly from the Cloudflare dashboard or via their CLI (Wrangler).
易于部署： 可以直接通过Cloudflare控制台或其CLI（Wrangler）进行简单的部署。
Secure API Key Management: Environment variables provide a secure way to handle sensitive API keys, separate from your code.
安全的API密钥管理： 环境变量提供了一种安全的方式来处理敏感的API密钥，使其与您的代码分离。
🚀 Setup | 🚀 设置
Create a Cloudflare Worker: Go to your Cloudflare dashboard, navigate to "Workers & Pages", and create a new Worker.
创建Cloudflare Worker： 登录到您的Cloudflare控制台，导航到“Workers & Pages”，然后创建一个新的Worker。
Paste the Code: Replace the default Worker code with the provided code below.
粘贴代码： 将默认的Worker代码替换为下面提供的代码。
Add Environment Variable:
Go to the Worker's settings.
Find the "Environment Variables" or "Secrets" section.
Add a new variable with the name GEMINI_API_KEY.
Set the value to your actual Google AI Studio or Google Cloud Vertex AI API Key.
添加环境变量：
进入Worker的设置页面。
找到“环境变量”（Environment Variables）或“秘密”（Secrets）部分。
添加一个新变量，名称为 GEMINI_API_KEY。
将值设置为您实际的Google AI Studio或Google Cloud Vertex AI API Key。
Save and Deploy: Save the Worker script. Cloudflare will deploy it automatically.
保存并部署： 保存Worker脚本。Cloudflare将自动部署它。
🔑 Setting API Key for Deployment | 🔑 部署时设置API Key
Important: For production deployment, DO NOT hardcode your API key in the script. As shown in the provided code, the API key is read from the environment variable env.GEMINI_API_KEY.

重要： 对于正式部署，请勿将您的API密钥硬编码在脚本中。如提供的代码所示，API密钥是从环境变量 env.GEMINI_API_KEY 中读取的。

To set the API key for formal deployment, follow these steps in your Cloudflare dashboard:

要为正式部署设置API密钥，请在您的Cloudflare控制台中按照以下步骤操作：

Navigate to your Worker's settings.
导航到您的Worker的设置页面。
Find the "Environment Variables" or "Secrets" section.
找到“变量”（Variables）或“密钥”（Secrets）部分。
Add a new variable.
添加一个新变量。
Set the variable name to GEMINI_API_KEY.
将变量名称设置为 GEMINI_API_KEY。
Enter your Google AI API Key as the variable value.
输入您的Google AI API密钥作为变量值。
Save the changes.
保存更改。
This ensures your API key is managed securely by Cloudflare and is not exposed in your code repository.

这确保了您的API密钥由Cloudflare安全管理，并且不会暴露在您的代码仓库中
