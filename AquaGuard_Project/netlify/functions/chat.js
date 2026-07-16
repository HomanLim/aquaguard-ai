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
        const apiKey = process.env.DEEPSEEK_API_KEY; 

        if (!apiKey) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: '环境变量缺失' }) };
        }

        // 优化后的逻辑：增加 System 指令，确保 AI 分析所有输入点
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { 
                        role: "system", 
                        content: "你是一个专业的环境治理专家。请仔细阅读用户提供的所有输入信息（包括地理位置、环境描述和图片分析结果），不要遗漏任何细节。请确保对输入的所有部分进行评估，并给出结构化的治理建议。" 
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            return { statusCode: response.status, headers, body: JSON.stringify({ error: 'DeepSeek API 报错' }) };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply: data.choices[0].message.content })
        };
        
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
