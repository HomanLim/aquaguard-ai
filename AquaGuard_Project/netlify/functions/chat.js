// 这是您的云端后端，专门负责和 DeepSeek 沟通，保护密钥安全
exports.handler = async function(event, context) {
    // 1. 设置跨域头，防止浏览器拦截请求
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // 2. 处理预检请求 (OPTIONS)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // 3. 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        
        // 这里会自动读取您在 Netlify 后台填写的 DEEPSEEK_API_KEY
        const apiKey = process.env.DEEPSEEK_API_KEY; 

        if (!apiKey) {
            console.error("API Key 未配置!");
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ error: '环境变量 DEEPSEEK_API_KEY 缺失，请在 Netlify 后台添加并 Trigger Deploy' }) 
            };
        }

        // 干净的、没有任何多余括号的真实 DeepSeek API 网址
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat", // 使用 DeepSeek 的对话模型
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2 // 稍微调低温度，让 AI 评估更严谨客观
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("DeepSeek 官方返回报错:", errText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: `DeepSeek API 报错: ${errText}` })
            };
        }
        const data = await response.json();
        
        // 将 DeepSeek 生成的结果返回给您的网页
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };
        
    } catch (error) {
        console.error("后端执行错误:", error);
        return { 
            statusCode: 500, 
            headers,
            body: JSON.stringify({ error: `代码执行崩溃: ${error.message}` }) 
        };
    }
};