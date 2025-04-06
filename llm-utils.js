class LLMUtils {
    static async query(apiKey, systemPrompt, userContent, options = {}, temperature = 0.7, model = 'gpt-4o-mini', max_tokens = 2000) {
        const defaultOptions = {
            model: model,
            temperature: temperature,
            max_tokens: max_tokens,
            parseJson: true,
            expectedSchema: null
        };

        const finalOptions = { ...defaultOptions, ...options };

        // If a schema is provided, append it to the system prompt
        let finalSystemPrompt = systemPrompt;
        if (finalOptions.expectedSchema) {
            finalSystemPrompt = `${systemPrompt}\n\n${LLMUtils.createJsonFormatInstructions(finalOptions.expectedSchema)}`;
        }

        try {
            // Determine API endpoint based on model
            let url = 'https://api.openai.com/v1/chat/completions';
            if (model.startsWith('llama')) {
                url = 'https://api.groq.com/openai/v1/chat/completions';
                // Use Groq API key for Llama models
                apiKey = localStorage.getItem('groq_api_key') || apiKey;

                // Prepend meta-llama/ for Llama 4 models
                if (model.includes('llama-4')) {
                    finalOptions.model = `meta-llama/${model}`;
                }
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: finalOptions.model,
                    messages: [
                        { role: 'system', content: finalSystemPrompt },
                        { 
                            role: 'user', 
                            content: Array.isArray(userContent) ? userContent : [{ type: 'text', text: userContent }]
                        }
                    ],
                    temperature: finalOptions.temperature,
                    max_tokens: finalOptions.max_tokens
                })
            });

            if (!response.ok) {
                const responseHeaders = Object.fromEntries(response.headers.entries());
                const responseBody = await response.text();
                console.error('Full response:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: responseHeaders,
                    body: responseBody
                });
                throw new Error(`API request failed: ${response.status} ${response.statusText}\nHeaders: ${JSON.stringify(responseHeaders, null, 2)}\nBody: ${responseBody}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            if (finalOptions.parseJson) {
                return LLMUtils.parseJsonResponse(content);
            }

            return content;
        } catch (error) {
            console.error('Error in LLM query:', error);
            throw error;
        }
    }

    static parseJsonResponse(content) {
        try {
            // Remove any text before the first {
            content = content.substring(content.indexOf('{'));
            
            // Remove markdown code block syntax if present
            content = content.replace(/```json\n?/g, '');
            content = content.replace(/```\n?/g, '');
            
            // Remove any comments (both // and /* */ style)
            content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
            
            // Remove any trailing commas in objects/arrays (which can cause JSON.parse to fail)
            content = content.replace(/,(\s*[}\]])/g, '$1');
            
            // Parse the cleaned content
            return JSON.parse(content);
        } catch (error) {
            console.error('Error parsing JSON response:', error);
            console.error('Content that failed to parse:', content);
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    static createJsonFormatInstructions(schema) {
        const formatSchema = (schema, indent = 0) => {
            const spaces = ' '.repeat(indent);
            let result = '';

            if (typeof schema === 'object') {
                if (schema.type === 'object') {
                    result += '{\n';
                    const properties = Object.entries(schema.properties).map(([key, value]) => {
                        let description = value.description ? ` // ${value.description}` : '';
                        return `${spaces}    "${key}": ${formatSchema(value, indent + 4)}${description}`;
                    });
                    result += properties.join(',\n');
                    result += `\n${spaces}}`;
                } else if (schema.type === 'array') {
                    result += `[${formatSchema(schema.items, indent)}]`;
                } else {
                    result += schema.type;
                    if (schema.enum) {
                        result += ` (one of: ${schema.enum.join(', ')})`;
                    }
                }
            }

            return result;
        };

        return `You MUST return ONLY a JSON object in exactly the following format, with no additional text or explanation:

${formatSchema(schema)}

Your response must:
1. Start with the opening brace {
2. Contain ONLY the JSON object
3. End with the closing brace }
4. Include all required fields
5. Use the exact field names shown
6. Match the types specified
7. NOT include any explanatory text before or after the JSON`;
    }
}

// Export the class for use in other files
window.LLMUtils = LLMUtils; 