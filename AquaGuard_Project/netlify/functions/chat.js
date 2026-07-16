exports.handler = async (event) => {

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers,
            body: ""
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({
                error: "Method Not Allowed"
            })
        };
    }

    try {

        const apiKey = process.env.DEEPSEEK_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: "DEEPSEEK_API_KEY not found."
                })
            };
        }

        const body = JSON.parse(event.body);

        const prompt = body.prompt || "";

        if (!prompt.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: "Prompt is empty."
                })
            };
        }

        const systemPrompt = `
You are AquaGuard AI.

You are an interdisciplinary expert in:

- Groundwater Hydrology
- Water Quality Engineering
- Landfill Leachate Migration
- Environmental Toxicology
- Environmental Engineering
- Public Health
- Risk Assessment

Your task is to analyze community groundwater contamination.

Carefully consider ALL information supplied by the user.

This includes:

• Water source

• Weather

• Water color

• RGB image feature

• Turbidity

• Odor

• Natural language description

• Reported symptoms

Do not ignore any field.

Reason scientifically.

Explain WHY.

Identify possible pollutants.

Assess uncertainty.

Finally produce ONLY valid JSON.

Never output markdown.

Never output explanations outside JSON.
`;

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 60000);

        const response = await fetch(
            "https://api.deepseek.com/chat/completions",
            {
                method: "POST",
                signal: controller.signal,
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({

                    model: "deepseek-reasoner",

                    messages: [

                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {
                            role: "user",
                            content: prompt
                        }

                    ],

                    temperature: 0.5,

                    max_tokens: 1500,

                    top_p: 0.95,

                    frequency_penalty: 0,

                    presence_penalty: 0

                })
            }
        );

        clearTimeout(timeout);

        const result = await response.json();

        if (!response.ok) {

            return {

                statusCode: response.status,

                headers,

                body: JSON.stringify({

                    error: result

                })

            };

        }

        const reply = result?.choices?.[0]?.message?.content;

        if (!reply) {

            return {

                statusCode: 500,

                headers,

                body: JSON.stringify({

                    error: "No response from DeepSeek."

                })

            };

        }

        return {

            statusCode: 200,

            headers,

            body: JSON.stringify({

                reply

            })

        };

    }

    catch (err) {

        return {

            statusCode: 500,

            headers,

            body: JSON.stringify({

                error: err.message

            })

        };

    }

};
