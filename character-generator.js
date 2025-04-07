class CharacterGenerator {
    constructor() {
        this.currentCharacter = null;
        this.currentParts = [];
        this.currentPartIndex = 0;
        this.gridSize = 128;
        this.enableCircles = true;
    }

    async planCharacterParts(apiKey, prompt, model = 'gpt-4o-mini') {
        const planningPrompt = `You are an expert character designer. Your task is to plan out the parts needed to create a cohesive pixel art character.

For any character, you MUST include:
1. Eyes - Essential for bringing the character to life
2. Mouth - Critical for expression and personality

Then, determine what other parts are needed based on the character description. For example:
- A knight might need: body, armor, helmet, weapon
- A tree might need: trunk, branches, leaves, roots
- A ghost might need: core, wisps, aura
- A robot might need: head, body, arms, legs, antenna

IMPORTANT: For each part, provide specific design guidance that ensures cohesion with the overall character.
Consider:
- How this part connects visually with others
- Specific color relationships between parts
- Texture and style consistency
- Size and proportion relationships
- How it contributes to the character's personality
- Any unique features or details it should have

Return ONLY a JSON object with:
{
    "parts": [
        {
            "id": "unique_id",
            "name": "part name",
            "description": "brief description of this part's role in the character",
            "design_guidance": "Specific instructions for how this part should be designed to maintain cohesion",
            "suggested_colors": ["#HEX1", "#HEX2"],
            "z_index_range": {"min": 0, "max": 100}
        }
    ],
    "design_notes": "Brief notes about the overall character design strategy",
    "color_strategy": "How colors should work together across all parts",
    "style_guide": "Specific style elements that should be consistent across all parts"
}

The parts MUST be ordered in a logical way for layered construction (background to foreground).
Eyes and mouth should be among the last parts added to ensure they appear on top.`;

        try {
            const response = await LLMUtils.query(
                apiKey,
                planningPrompt,
                prompt,
                {
                    expectedSchema: {
                        type: 'object',
                        properties: {
                            parts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        design_guidance: { type: 'string' },
                                        suggested_colors: {
                                            type: 'array',
                                            items: { type: 'string' }
                                        },
                                        z_index_range: {
                                            type: 'object',
                                            properties: {
                                                min: { type: 'number' },
                                                max: { type: 'number' }
                                            }
                                        }
                                    }
                                }
                            },
                            design_notes: { type: 'string' },
                            color_strategy: { type: 'string' },
                            style_guide: { type: 'string' }
                        }
                    }
                },
                0.7,
                model
            );

            this.currentParts = response.parts;
            this.currentPartIndex = 0;
            this.designNotes = response.design_notes;
            this.colorStrategy = response.color_strategy;
            this.styleGuide = response.style_guide;

            // Return both the response data and token usage
            return {
                parts: response.parts,
                design_notes: response.design_notes,
                color_strategy: response.color_strategy,
                style_guide: response.style_guide,
                usage: response._raw?.usage || { input_tokens: 0, output_tokens: 0 }
            };
        } catch (error) {
            console.error('Error planning character parts:', error);
            throw error;
        }
    }

    async generateNextPart(apiKey, prompt, model = 'gpt-4o-mini') {
        if (!this.currentParts || this.currentPartIndex >= this.currentParts.length) {
            throw new Error('No more parts to generate');
        }

        const currentPart = this.currentParts[this.currentPartIndex];
        const previousShapes = this.currentCharacter ? this.currentCharacter.shapes : [];
        
        const generationPrompt = `You are generating the ${currentPart.name} for a pixel art character based on this concept:
"${prompt}"

Overall Character Design Strategy:
${this.designNotes}

Color Strategy:
${this.colorStrategy}

Style Guide:
${this.styleGuide}

SPECIFIC GUIDANCE FOR THIS PART:
${currentPart.design_guidance}

IMPORTANT DESIGN PHILOSOPHY:
- Do NOT aim for minimalism - use as many shapes as needed for high-quality output
- Layer multiple shapes to create depth, texture, and visual interest
- Use gradients of color by layering similar-colored shapes
- Create sophisticated details through careful shape placement
- Add highlights, shadows, and subtle variations
- Build complex forms through shape composition
- Focus on quality and visual impact over simplicity

This part should:
- Follow the overall design strategy above
- Stay true to the original character concept
- Create rich, detailed visuals using multiple layered shapes
- Use sophisticated color combinations and shading
- Build depth through overlapping elements
- Stay within the suggested z-index range (${currentPart.z_index_range.min} to ${currentPart.z_index_range.max})
- Focus on the specific role described: ${currentPart.description}

Design Guidance:
- Use multiple shapes to create gradients and texture
- Layer shapes for highlights and shadows
- Add detail shapes for visual interest
- Create depth through overlapping elements
- Use shape clusters for complex features
- Don't hesitate to use many shapes for quality results

Suggested colors: ${currentPart.suggested_colors.join(', ')}
Consider using variations of these colors for depth and detail.

You are working on a ${this.gridSize}x${this.gridSize} grid. Each shape must align to the grid.
${this.enableCircles ? 
    'You may use both rectangles and circles. Circles are great for organic shapes and smooth features. Layer circles and rectangles for complex effects.' : 
    'IMPORTANT: You must use ONLY rectangles. DO NOT use circles or any other shape type. Create rounded effects using many small rectangles - more rectangles will give smoother curves.'} 

Return ONLY a JSON object with an array of shapes for this part:
{
    "shapes": [
        {
            "id": "unique_id",
            "type": "${this.enableCircles ? '"rectangle" or "circle"' : '"rectangle" only'}",
            "x": 0-${this.gridSize-1},
            "y": 0-${this.gridSize-1},
            "width": number,
            "height": number,
            "color": "#HEX",
            "z_index": number
        }
    ]
}`;

        try {
            const response = await LLMUtils.query(
                apiKey,
                generationPrompt,
                [
                    {
                        type: 'text',
                        text: `Generating part: ${currentPart.name}\n\n${previousShapes.length > 0 ? 'Existing shapes:\n' + JSON.stringify(previousShapes, null, 2) : 'No existing shapes yet.'}`
                    }
                ],
                {
                    expectedSchema: Prompts.getCharacterGenerationSchema(this.gridSize)
                },
                0.7,
                model
            );

            // Ensure no circles if they're not enabled
            const newShapes = response.shapes.map(shape => ({
                ...shape,
                id: `${currentPart.id}_${shape.id}`,
                type: this.enableCircles ? shape.type : 'rectangle'
            }));

            if (!this.currentCharacter) {
                this.currentCharacter = new Character(newShapes, '', this.gridSize, prompt);
            } else {
                this.currentCharacter.shapes = [...previousShapes, ...newShapes];
            }

            this.currentPartIndex++;

            // Return both the result data and token usage
            return {
                part: currentPart,
                shapes: newShapes,
                isComplete: this.currentPartIndex >= this.currentParts.length,
                usage: response._raw?.usage || { input_tokens: 0, output_tokens: 0 }
            };
        } catch (error) {
            console.error('Error generating character part:', error);
            throw error;
        }
    }

    async finalizeCharacter(apiKey, prompt, model = 'gpt-4o-mini') {
        if (!this.currentCharacter) {
            throw new Error('No character to finalize');
        }

        const finalizationPrompt = `You are reviewing a completed pixel art character for final enhancements.
Your task is to perfect the character by:

1. Analyzing the overall composition
2. Identifying opportunities for improvement
3. Making final adjustments to ensure maximum visual appeal

IMPORTANT SHAPE RESTRICTION:
${this.enableCircles ? 
    'You may use both rectangles and circles. Use circles for organic shapes and smooth features.' : 
    'You must use ONLY rectangles. DO NOT use circles or any other shape type. Create rounded effects using small rectangles if needed.'}

You can and should:
1. Add new shapes for details like:
   - Highlights and shadows
   - Texture and depth
   - Small decorative elements
   - Additional facial features
   - Environmental effects (sparkles, glow, etc.)
2. Adjust existing shapes:
   - Position and size
   - Colors and contrast
   - Layer ordering (z-index)
3. Remove unnecessary shapes

Focus on:
1. Making the character pop visually
2. Adding personality through small details
3. Enhancing depth and dimensionality
4. Creating visual interest
5. Maintaining clean, readable design

IMPORTANT: To save tokens, your response should ONLY include:
1. Any NEW shapes you're adding
2. Any MODIFIED shapes with their updated properties
3. The IDs of any shapes you want to REMOVE

Return a JSON object with:
{
    "add": [array of new shapes to add],
    "modify": [array of modified shapes with their new properties],
    "remove": [array of shape IDs to remove]
}

Shape type must be: ${this.enableCircles ? '"rectangle" or "circle"' : '"rectangle" only'}`;

        try {
            const response = await LLMUtils.query(
                apiKey,
                finalizationPrompt,
                [
                    {
                        type: 'text',
                        text: `Original character concept: ${prompt}\n\nCurrent shapes:\n${JSON.stringify(this.currentCharacter.shapes, null, 2)}`
                    }
                ],
                {
                    expectedSchema: {
                        type: 'object',
                        properties: {
                            add: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        type: { type: 'string' },
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        width: { type: 'number' },
                                        height: { type: 'number' },
                                        color: { type: 'string' },
                                        z_index: { type: 'number' }
                                    }
                                }
                            },
                            modify: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        type: { type: 'string' },
                                        x: { type: 'number' },
                                        y: { type: 'number' },
                                        width: { type: 'number' },
                                        height: { type: 'number' },
                                        color: { type: 'string' },
                                        z_index: { type: 'number' }
                                    }
                                }
                            },
                            remove: {
                                type: 'array',
                                items: { type: 'string' }
                            }
                        }
                    }
                },
                0.8,
                model,
                4000 // Increased max_tokens
            );

            // Start with existing shapes
            let finalShapes = [...this.currentCharacter.shapes];

            // Remove shapes
            if (response.remove && response.remove.length > 0) {
                finalShapes = finalShapes.filter(shape => !response.remove.includes(shape.id));
            }

            // Modify shapes
            if (response.modify && response.modify.length > 0) {
                response.modify.forEach(modifiedShape => {
                    const index = finalShapes.findIndex(shape => shape.id === modifiedShape.id);
                    if (index !== -1) {
                        finalShapes[index] = {
                            ...modifiedShape,
                            type: this.enableCircles ? modifiedShape.type : 'rectangle'
                        };
                    }
                });
            }

            // Add new shapes
            if (response.add && response.add.length > 0) {
                const newShapes = response.add.map(shape => ({
                    ...shape,
                    type: this.enableCircles ? shape.type : 'rectangle'
                }));
                finalShapes = [...finalShapes, ...newShapes];
            }

            // Update the character with final shapes
            this.currentCharacter.shapes = finalShapes;

            // Return the finalization result with the updated character and token usage
            return {
                finalResult: response,
                character: this.currentCharacter,
                usage: response._raw?.usage || { input_tokens: 0, output_tokens: 0 }
            };

        } catch (error) {
            console.error('Error finalizing character:', error);
            throw error;
        }
    }

    reset() {
        this.currentCharacter = null;
        this.currentParts = [];
        this.currentPartIndex = 0;
    }
} 