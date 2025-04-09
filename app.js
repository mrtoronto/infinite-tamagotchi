class PixelCharacterGenerator {
    constructor() {
        this.apiKey = localStorage.getItem('openai_api_key') || '';
        this.groqApiKey = localStorage.getItem('groq_api_key') || '';
        this.selectedModel = localStorage.getItem('selected_model') || 'gpt-4o-mini';
        this.characters = [];
        this.savedCharacters = this.loadSavedCharacters();
        this.selectedCharacter = null;
        this.gridSize = parseInt(localStorage.getItem('grid_size') || '128');
        this.backgroundColor = localStorage.getItem('preview_background') || '#f0f0f0';
        this.enableCircles = localStorage.getItem('enable_circles') === 'true';
        this.totalTokens = {
            input: 0,
            output: 0,
            inputPrice: 0,
            outputPrice: 0
        };
        this.modelPrices = {
            'gpt-4o': {
                input: 2.50 / 1000000,  // $2.50 per 1M tokens
                output: 10.00 / 1000000  // $10.00 per 1M tokens
            },
            'gpt-4o-mini': {
                input: 0.15 / 1000000,   // $0.15 per 1M tokens
                output: 0.60 / 1000000   // $0.60 per 1M tokens
            },
            'llama-3.3-70b-versatile': {
                input: 0,
                output: 0
            },
            'llama-4-scout-17b-16e-instruct': {
                input: 0,
                output: 0
            },
            'llama-4-maverick-17b-128e-instruct': {
                input: 0,
                output: 0
            }
        };
        this.initializeUI();
        this.checkForPendingCombination();
    }

    checkForPendingCombination() {
        const pendingCombination = localStorage.getItem('pending_combination');
        if (pendingCombination) {
            const parentInfo = JSON.parse(pendingCombination);
            localStorage.removeItem('pending_combination');
            
            // Find the parent characters
            const firstCharacter = this.savedCharacters.find(char => char.id === parentInfo.firstParent.id);
            const secondCharacter = this.savedCharacters.find(char => char.id === parentInfo.secondParent.id);
            
            if (firstCharacter && secondCharacter) {
                this.combineCharacters(firstCharacter, secondCharacter);
            }
        }
    }

    initializeUI() {
        // Initialize API key section
        document.getElementById('apiKey').value = this.apiKey;
        document.getElementById('groqApiKey').value = this.groqApiKey;
        document.getElementById('modelSelect').value = this.selectedModel;
        
        document.getElementById('saveApiKey').addEventListener('click', () => this.saveApiKey());
        document.getElementById('saveGroqApiKey').addEventListener('click', () => this.saveGroqApiKey());
        document.getElementById('modelSelect').addEventListener('change', (e) => this.saveModelSelection(e.target.value));

        // Initialize grid size selection
        const gridSizeSelect = document.getElementById('gridSize');
        gridSizeSelect.value = this.gridSize.toString();
        gridSizeSelect.addEventListener('change', (e) => {
            this.gridSize = parseInt(e.target.value);
            localStorage.setItem('grid_size', this.gridSize.toString());
        });

        // Initialize circle toggle
        const enableCirclesCheckbox = document.getElementById('enableCircles');
        enableCirclesCheckbox.checked = this.enableCircles;
        enableCirclesCheckbox.addEventListener('change', (e) => {
            this.enableCircles = e.target.checked;
            localStorage.setItem('enable_circles', this.enableCircles.toString());
        });

        // Initialize background color selection
        document.querySelectorAll('.color-preset').forEach(preset => {
            const color = preset.dataset.color;
            if (color === this.backgroundColor) {
                preset.classList.add('selected');
            }
            preset.addEventListener('click', () => this.setBackgroundColor(color, preset));
        });

        const customColorInput = document.getElementById('customBackgroundColor');
        customColorInput.value = this.backgroundColor;
        customColorInput.addEventListener('input', (e) => this.setBackgroundColor(e.target.value));

        // Set initial background color
        document.documentElement.style.setProperty('--preview-background', this.backgroundColor);

        // Initialize generation section
        document.getElementById('generateCharacters').addEventListener('click', () => this.generateCharacters());

        // Initialize save section
        document.getElementById('saveCharacter').addEventListener('click', () => this.showSaveModal(this.selectedCharacter));

        // Display saved characters
        this.displaySavedCharacters();
    }

    setBackgroundColor(color, clickedPreset = null) {
        this.backgroundColor = color;
        localStorage.setItem('preview_background', color);
        document.documentElement.style.setProperty('--preview-background', color);
        
        // Update custom color input
        document.getElementById('customBackgroundColor').value = color;
        
        // Update preset selection
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('selected');
            if (preset === clickedPreset) {
                preset.classList.add('selected');
            }
        });

        // Refresh displays
        this.displayCharacters();
        this.displaySavedCharacters();
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('openai_api_key', apiKey);
            alert('OpenAI API key saved successfully!');
        } else {
            alert('Please enter a valid OpenAI API key');
        }
    }

    saveGroqApiKey() {
        const apiKey = document.getElementById('groqApiKey').value.trim();
        if (apiKey) {
            this.groqApiKey = apiKey;
            localStorage.setItem('groq_api_key', apiKey);
            alert('Groq API key saved successfully!');
        } else {
            alert('Please enter a valid Groq API key');
        }
    }

    saveModelSelection(model) {
        this.selectedModel = model;
        localStorage.setItem('selected_model', model);
        
        // Reset token totals when model changes
        this.totalTokens = {
            input: 0,
            output: 0,
            inputPrice: 0,
            outputPrice: 0
        };
        this.updateTotalTokenDisplay();
    }

    async generatePromptVariations(originalPrompt) {
        try {
            const response = await LLMUtils.query(
                this.apiKey,
                `You are an expert at creating subtle variations of character descriptions. Given an original character description, create 10 different variations that maintain the core concept while making only minor adjustments to specific details.

Each variation should:
1. Keep the exact same core concept and subject
2. Only modify small, specific details (like color, size, texture, or minor features)
3. Maintain the same overall style and tone
4. Be subtle enough that the variations are clearly the same concept

For example, if the original is "a red apple":
✓ "a bright red apple with a glossy sheen"
✓ "a deep red apple with a small leaf"
✓ "a red apple with a slight green tint"
✗ "a green pear" (too different)
✗ "a fruit basket" (completely different concept)

Return ONLY a JSON array of 10 strings, each being a subtle variation of the original prompt.`,
                `Original prompt: ${originalPrompt}`,
                {
                    expectedSchema: {
                        type: 'array',
                        items: {
                            type: 'string',
                            description: 'A subtle variation of the original character description'
                        }
                    },
                    parseJson: true
                },
                0.3 // Lower temperature for more consistent variations
            );

            // Handle both direct array response and nested variations property
            let variations = Array.isArray(response) ? response : 
                           (response.variations && Array.isArray(response.variations) ? response.variations : 
                           [originalPrompt]);

            // Ensure we have exactly 10 variations
            if (variations.length < 10) {
                console.warn('Got fewer than 10 variations, filling with original prompt');
                while (variations.length < 10) {
                    variations.push(originalPrompt);
                }
            }

            return variations;
        } catch (error) {
            console.error('Error generating prompt variations:', error);
            // Return array with original prompt repeated 10 times as fallback
            return Array(10).fill(originalPrompt);
        }
    }

    async generateCharacters() {
        if (!this.apiKey && !this.groqApiKey) {
            alert('Please enter either an OpenAI API key or a Groq API key first');
            return;
        }

        const prompt = document.getElementById('characterPrompt').value.trim();
        if (!prompt) {
            alert('Please enter a character description');
            return;
        }

        // Disable button and show spinner
        const generateButton = document.getElementById('generateCharacters');
        generateButton.disabled = true;
        generateButton.classList.add('loading');

        // Reset UI state
        document.getElementById('generationProgress').classList.remove('hidden');
        document.getElementById('loadingIndicator').classList.remove('hidden');

        // Clear previous characters array
        this.characters = [];

        try {
            // Reset token counters
            this.totalTokens = { input: 0, output: 0 };
            document.getElementById('tokenUsageTotal').classList.remove('hidden');
            this.updateTotalTokenDisplay();

            // Reset and hide all progress steps initially
            document.querySelectorAll('.progress-cell').forEach(cell => {
                // Reset token counters
                cell.querySelector('.input-tokens').textContent = '0';
                cell.querySelector('.output-tokens').textContent = '0';
                
                // Find all progress steps
                const steps = cell.querySelectorAll('.progress-step');
                steps.forEach((step, index) => {
                    if (index === 0) {
                        // Show planning step
                        step.classList.remove('hidden');
                        step.querySelector('.planningNotes').textContent = 'Planning character...';
                    } else {
                        // Hide other steps
                        step.classList.add('hidden');
                    }
                });

                // Clear any existing text
                const currentPart = cell.querySelector('.currentPart');
                const partProgress = cell.querySelector('.partProgress');
                const finalizingNotes = cell.querySelector('.finalizingNotes');
                
                if (currentPart) currentPart.textContent = '';
                if (partProgress) partProgress.style.setProperty('--progress-width', '0%');
                if (finalizingNotes) finalizingNotes.textContent = '';
            });

            // Create 6 generators
            const generators = Array.from({ length: 6 }, () => {
                const generator = new CharacterGenerator();
                generator.gridSize = this.gridSize;
                generator.enableCircles = this.enableCircles;
                return generator;
            });

            // Generate all characters in parallel
            const characterPromises = generators.map((generator, index) => 
                this.generateSingleCharacter(generator, prompt, index)
                    .then(character => {
                        if (character) {
                            return this.finalizeSingleCharacter(generator, prompt, index, character);
                        }
                        return null;
                    })
                    .catch(error => {
                        console.error(`Error with character ${index}:`, error);
                        return null;
                    })
            );

            // Wait for all characters to complete
            this.characters = (await Promise.all(characterPromises)).filter(char => char !== null);

            // Handle the character grid display
            const characterGrid = document.getElementById('characterGrid');
            if (characterGrid) {
                characterGrid.style.display = 'none';
            }

            // Show save section if any characters were generated
            if (this.characters.length > 0) {
                const saveSection = document.getElementById('saveSection');
                if (saveSection) {
                    saveSection.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error generating characters:', error);
            alert('Error generating characters. Please try again.');
        } finally {
            // Re-enable button and hide spinner
            generateButton.disabled = false;
            generateButton.classList.remove('loading');
            document.getElementById('loadingIndicator').classList.add('hidden');
        }
    }

    async generateSingleCharacter(generator, prompt, index) {
        const progressCell = document.getElementById(`progress-${index}`);
        const previewContainer = progressCell.querySelector('.character-preview-wrapper');
        
        try {
            // Get all progress steps
            const steps = progressCell.querySelectorAll('.progress-step');
            const planningStep = steps[0];
            const generatingStep = steps[1];
            const finalizingStep = steps[2];

            // Plan the character parts
            planningStep.querySelector('.planningNotes').textContent = 'Planning character parts...';
            const plan = await generator.planCharacterParts(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                prompt,
                this.selectedModel
            );
            
            // Update token count from planning
            if (plan && plan.usage) {
                console.log(`Planning tokens for character ${index}:`, plan.usage);
                this.updateTokenDisplay(index, plan.usage.prompt_tokens || plan.usage.input_tokens || 0, plan.usage.completion_tokens || plan.usage.output_tokens || 0);
            }
            
            planningStep.querySelector('.planningNotes').textContent = plan.design_notes;

            // Show the "Generating Parts" step now that we're starting generation
            generatingStep.classList.remove('hidden');

            // Generate each part in sequence
            let isComplete = false;
            const totalParts = plan.parts.length;
            let currentPartIndex = 0;

            while (!isComplete) {
                const currentPart = plan.parts[currentPartIndex];
                generatingStep.querySelector('.currentPart').textContent = `Generating ${currentPart.name}...`;
                generatingStep.querySelector('.partProgress').style.setProperty('--progress-width', `${((currentPartIndex + 1) / totalParts) * 100}%`);

                const result = await generator.generateNextPart(
                    this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                    prompt,
                    this.selectedModel
                );
                
                // Update token count from part generation immediately
                if (result && result.usage) {
                    console.log(`Part generation tokens for character ${index}, part ${currentPartIndex}:`, result.usage);
                    this.updateTokenDisplay(index, result.usage.prompt_tokens || result.usage.input_tokens || 0, result.usage.completion_tokens || result.usage.output_tokens || 0);
                }

                // Update the preview after each part
                if (generator.currentCharacter) {
                    let canvas = previewContainer.querySelector('canvas');
                    if (!canvas) {
                        canvas = document.createElement('canvas');
                        previewContainer.appendChild(canvas);
                    }
                    generator.currentCharacter.render(canvas);
                }

                isComplete = result.isComplete;
                currentPartIndex++;
            }

            return generator.currentCharacter;
        } catch (error) {
            console.error(`Error generating character ${index}:`, error);
            if (progressCell) {
                const steps = progressCell.querySelectorAll('.progress-step');
                if (steps[0]) steps[0].querySelector('.planningNotes').textContent = 'Error occurred during planning.';
                if (steps[1]) steps[1].querySelector('.currentPart').textContent = '';
                if (steps[2]) steps[2].querySelector('.finalizingNotes').textContent = 'Generation failed.';
            }
            throw error;
        }
    }

    async finalizeSingleCharacter(generator, prompt, index, character) {
        const progressCell = document.getElementById(`progress-${index}`);
        if (!progressCell) return character;

        const previewContainer = progressCell.querySelector('.character-preview-wrapper');
        const spinner = previewContainer?.querySelector('.character-spinner');
        
        try {
            // Get all progress steps
            const steps = progressCell.querySelectorAll('.progress-step');
            const finalizingStep = steps[2];
            if (!finalizingStep) return character;

            // Show the "Finalizing" step now that we're starting finalization
            finalizingStep.classList.remove('hidden');
            const finalizingNotes = finalizingStep.querySelector('.finalizingNotes');
            if (finalizingNotes) {
                finalizingNotes.textContent = 'Making final adjustments and generating name...';
            }
            
            const finalResult = await generator.finalizeCharacter(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                prompt,
                this.selectedModel
            );
            
            // Update token count from finalization
            if (finalResult?.usage) {
                console.log(`Finalization tokens for character ${index}:`, finalResult.usage);
                this.updateTokenDisplay(index, 
                    finalResult.usage.prompt_tokens || finalResult.usage.input_tokens || 0, 
                    finalResult.usage.completion_tokens || finalResult.usage.output_tokens || 0
                );
            }

            // Generate a name for the character
            const namePrompt = `Create a unique and creative name for this character based on its description and design notes. The character is a pixel art creation with the following details:

Character Description: ${character.metadata?.description || 'No description available'}
Design Notes: ${steps[0].querySelector('.planningNotes').textContent}

The name should:
1. Be creative, whimsical, and descriptive
2. Reflect the character's personality, appearance, and traits
3. Use creative word combinations or portmanteaus
4. Be memorable and unique
5. Never use generic names like "character" or numbers
6. Be based on the character's key traits and design elements

Examples of good names:
- For a playful tree: "Whimblewood", "Bramblebloom", "Sproutsy"
- For a friendly robot: "Gizmoflux", "Sparklebot", "Cogsworth"
- For a magical creature: "Mystifluff", "Glowspark", "Twinkletoes"

Return ONLY the name as a string.`;
            
            const nameResponse = await LLMUtils.query(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                namePrompt,
                null,
                { expectedSchema: { type: 'string' } },
                0.8 // Higher temperature for more creative names
            );

            // Set the generated name, ensuring it's a string
            let characterName = '';
            if (typeof nameResponse === 'string') {
                characterName = nameResponse.trim();
            } else if (nameResponse && typeof nameResponse === 'object') {
                // Try to extract name from object if it's not a string
                characterName = nameResponse.name || nameResponse.text || nameResponse.content || '';
                if (typeof characterName !== 'string') {
                    characterName = '';
                }
            }
            
            // If we couldn't get a valid name, generate a creative one based on the planning text
            if (!characterName || characterName.toLowerCase().includes('character')) {
                const planningText = steps[0].querySelector('.planningNotes').textContent.toLowerCase();
                
                // Extract key traits and elements
                const traits = planningText.match(/\b(playful|friendly|whimsical|warm|strong|stable|magical|mystical|energetic|lively)\b/g) || [];
                const elements = planningText.match(/\b(tree|wood|leaf|branch|root|bark|nature|forest|garden|plant)\b/g) || [];
                
                // Create creative combinations
                const prefixes = ['Whim', 'Bram', 'Sprout', 'Leaf', 'Bark', 'Root', 'Twig', 'Branch', 'Forest', 'Garden'];
                const suffixes = ['wood', 'bloom', 'leaf', 'bark', 'root', 'twig', 'branch', 'sprout', 'blossom', 'grove'];
                
                // Combine traits and elements creatively
                if (traits.length > 0 && elements.length > 0) {
                    characterName = traits[0].charAt(0).toUpperCase() + traits[0].slice(1) + elements[0].charAt(0).toUpperCase() + elements[0].slice(1);
                } else {
                    // Fallback to creative prefix-suffix combination
                    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
                    characterName = prefix + suffix;
                }
            }
            
            character.name = characterName;

            // Create save button and container
            const saveContainer = document.createElement('div');
            saveContainer.className = 'save-character-container';
            
            const saveButton = document.createElement('button');
            saveButton.className = 'save-character-button';
            saveButton.textContent = 'Save Character';

            // Add spinner element to button
            const spinner = document.createElement('div');
            spinner.className = 'button-spinner';
            saveButton.appendChild(spinner);

            saveContainer.appendChild(saveButton);

            // Display the generated name and save button
            if (finalizingNotes) {
                finalizingNotes.innerHTML = `Character complete! Name: ${characterName}`;
                finalizingNotes.appendChild(saveContainer);
            }

            saveButton.addEventListener('click', async () => {
                try {
                    // Add spinner to button
                    saveButton.classList.add('loading');
                    saveButton.disabled = true;

                    // Generate stats using our probability-based system
                    const rolls = StatRoller.generateStats();

                    // Convert character to PNG and get base64
                    const canvas = document.createElement('canvas');
                    const size = character.gridSize;
                    canvas.width = size;
                    canvas.height = size;
                    character.render(canvas);
                    const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

                    const content = await LLMUtils.query(
                        this.apiKey,
                        Prompts.getCharacterAnalysisPrompt(),
                        [
                            {
                                type: 'text',
                                text: `Please analyze this character named "${character.name}". This character was generated based on the concept: ${character.generationPrompt}. Random rolls are:\nStrength: ${rolls.strength}\nDexterity: ${rolls.dexterity}\nConstitution: ${rolls.constitution}\nIntelligence: ${rolls.intelligence}\nWisdom: ${rolls.wisdom}\nCharisma: ${rolls.charisma}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${imageBase64}`
                                }
                            }
                        ],
                        { expectedSchema: Prompts.getCharacterAnalysisSchema(rolls) },
                        0.2
                    );
                    
                    // Get the planning notes from the progress step
                    const planningNotes = steps[0].querySelector('.planningNotes').textContent;
                    
                    // Update character metadata
                    character.metadata = {
                        stats: content.stats,
                        equipmentSlots: content.equipmentSlots.map(slot => ({
                            ...slot,
                            equipment: null // Initialize with no equipment
                        })),
                        description: content.description,
                        generationPrompt: character.generationPrompt,
                        planningNotes: planningNotes // Save the planning notes
                    };

                    // Save character
                    this.savedCharacters.push(character);
                    this.saveTolocalStorage();
                    this.displaySavedCharacters();

                    // Remove the entire progress cell
                    progressCell.remove();
                    
                    // Update the finalizing notes
                    finalizingNotes.textContent = `Character "${characterName}" saved successfully!`;
                    
                    // Remove the save button
                    saveContainer.remove();
                } catch (error) {
                    console.error('Error saving character:', error);
                    finalizingNotes.textContent = 'Error saving character. Please try again.';
                    // Remove loading state
                    saveButton.classList.remove('loading');
                    saveButton.disabled = false;
                }
            });

            // Check if we have a valid finalization result
            if (!finalResult?.finalResult?.add && !finalResult?.finalResult?.modify && !finalResult?.finalResult?.remove) {
                console.log(`No finalization changes for character ${index}`);
                
                // Hide the spinner
                if (spinner) {
                    spinner.classList.add('hidden');
                }

                return character;
            }

            // Update the preview with finalized character
            if (finalResult.character) {
                const canvas = previewContainer?.querySelector('canvas');
                if (canvas) {
                    finalResult.character.render(canvas);
                }

                const partProgress = finalizingStep.querySelector('.partProgress');
                if (partProgress) {
                    partProgress.style.setProperty('--progress-width', '100%');
                }
                
                // Hide the spinner
                if (spinner) {
                    spinner.classList.add('hidden');
                }

                return finalResult.character;
            }

            // If we get here, something went wrong with finalization
            console.warn(`Invalid finalization result structure for character ${index}`);
            if (finalizingNotes) {
                finalizingNotes.textContent = 'Using original character (finalization failed)';
            }
            
            // Hide the spinner
            if (spinner) {
                spinner.classList.add('hidden');
            }

            return character;

        } catch (error) {
            console.error(`Error finalizing character ${index}:`, error);
            const finalizingNotes = progressCell.querySelector('.finalizingNotes');
            if (finalizingNotes) {
                finalizingNotes.textContent = 'Using original character (finalization failed)';
            }
            
            // Hide the spinner
            if (spinner) {
                spinner.classList.add('hidden');
            }

            return character;
        }
    }

    displayCharacters() {
        const grid = document.getElementById('characterGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.style.display = 'grid'; // Make sure grid is visible
        
        this.characters.forEach((character, index) => {
            const container = document.createElement('div');
            container.className = 'character-card';
            container.dataset.characterId = character.id;
            
            const element = character.createPreviewElement(true);
            container.appendChild(element);
            
            // Add click handler to save the character
            container.addEventListener('click', () => {
                this.handleCharacterClick(character);
            });
            
            grid.appendChild(container);
        });
    }

    showSaveModal(character) {
        const modal = document.getElementById('saveCharacterModal');
        const nameInput = document.getElementById('modalCharacterName');
        const saveButton = document.getElementById('modalSaveButton');
        const cancelButton = document.getElementById('modalCancelButton');

        // Reset input
        nameInput.value = '';

        // Show modal
        modal.classList.remove('hidden');

        // Setup event listeners
        const handleSave = async () => {
            const name = nameInput.value.trim();
            if (!name) {
                alert('Please enter a name for your character');
                return;
            }

            if (!this.apiKey) {
                alert('Please set your OpenAI API key first');
                return;
            }

            try {
                // Show loading state
                saveButton.disabled = true;
                saveButton.textContent = 'Saving...';

                // Save the character
                await this.saveCharacter(character, name);

                // Hide modal
                modal.classList.add('hidden');

                // Redirect to character details page
                window.location.href = `character-details.html?id=${character.id}`;
            } catch (error) {
                console.error('Error saving character:', error);
                alert('Error saving character. Please try again.');
                saveButton.disabled = false;
                saveButton.textContent = 'Save Character';
            }
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            // Remove event listeners
            saveButton.removeEventListener('click', handleSave);
            cancelButton.removeEventListener('click', handleCancel);
        };

        // Add event listeners
        saveButton.addEventListener('click', handleSave);
        cancelButton.addEventListener('click', handleCancel);

        // Focus the input
        nameInput.focus();
    }

    async saveCharacter(character, name) {
        character.name = name;

        // Generate stats using our probability-based system
        const rolls = StatRoller.generateStats();

        // Convert character to PNG and get base64
        const canvas = document.createElement('canvas');
        const size = character.gridSize;
        canvas.width = size;
        canvas.height = size;
        character.render(canvas);
        const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

        const content = await LLMUtils.query(
            this.apiKey,
            Prompts.getCharacterAnalysisPrompt(),
            [
                {
                    type: 'text',
                    text: `Please analyze this character named "${character.name}". This character was generated based on the concept: ${character.generationPrompt}. Random rolls are:\nStrength: ${rolls.strength}\nDexterity: ${rolls.dexterity}\nConstitution: ${rolls.constitution}\nIntelligence: ${rolls.intelligence}\nWisdom: ${rolls.wisdom}\nCharisma: ${rolls.charisma}`
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:image/png;base64,${imageBase64}`
                    }
                }
            ],
            { expectedSchema: Prompts.getCharacterAnalysisSchema(rolls) },
            0.2
        );
        
        // Update character metadata
        character.metadata = {
            stats: content.stats,
            equipmentSlots: content.equipmentSlots.map(slot => ({
                ...slot,
                equipment: null // Initialize with no equipment
            })),
            description: content.description,
            generationPrompt: character.generationPrompt
        };

        // Save character
        this.savedCharacters.push(character);
        this.saveTolocalStorage();
        this.displaySavedCharacters();
    }

    loadSavedCharacters() {
        const saved = localStorage.getItem('saved_characters');
        if (!saved) return [];
        
        try {
            const data = JSON.parse(saved);
            return data.map(charData => Character.fromJSON(charData));
        } catch (error) {
            console.error('Error loading saved characters:', error);
            return [];
        }
    }

    saveTolocalStorage() {
        const data = this.savedCharacters.map(char => char.toJSON());
        localStorage.setItem('saved_characters', JSON.stringify(data));
    }

    displaySavedCharacters() {
        const grid = document.getElementById('savedCharacters');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.savedCharacters.forEach(character => {
            const container = document.createElement('div');
            container.className = 'character-card';
            container.dataset.characterId = character.id;
            
            const element = character.createPreviewElement(false);
            container.appendChild(element);
            
            // Add click handler to view details
            container.addEventListener('click', () => {
                window.location.href = `character-details.html?id=${character.id}`;
            });
            
            grid.appendChild(container);
        });
    }

    updateTokenDisplay(index, inputTokens, outputTokens) {
        if (!inputTokens && !outputTokens) return;

        console.log(`Updating tokens for character ${index}:`, { input: inputTokens, output: outputTokens });
        const progressCell = document.getElementById(`progress-${index}`);
        if (!progressCell) return;

        const inputCounter = progressCell.querySelector('.input-tokens');
        const outputCounter = progressCell.querySelector('.output-tokens');
        const inputPrice = progressCell.querySelector('.input-price');
        const outputPrice = progressCell.querySelector('.output-price');
        const totalPrice = progressCell.querySelector('.total-price');
        
        if (!inputCounter || !outputCounter || !inputPrice || !outputPrice || !totalPrice) return;
        
        // Get current values
        const currentInput = parseInt(inputCounter.textContent) || 0;
        const currentOutput = parseInt(outputCounter.textContent) || 0;
        
        // Calculate new values
        const newInput = currentInput + (inputTokens || 0);
        const newOutput = currentOutput + (outputTokens || 0);
        
        // Calculate prices
        const prices = this.modelPrices[this.selectedModel];
        const newInputPrice = newInput * prices.input;
        const newOutputPrice = newOutput * prices.output;
        const newTotalPrice = newInputPrice + newOutputPrice;
        
        // Update displays
        inputCounter.textContent = newInput;
        outputCounter.textContent = newOutput;
        inputPrice.textContent = `$${newInputPrice.toFixed(4)}`;
        outputPrice.textContent = `$${newOutputPrice.toFixed(4)}`;
        totalPrice.textContent = `$${newTotalPrice.toFixed(4)}`;
        
        console.log(`New token totals for character ${index}:`, { 
            input: newInput, 
            output: newOutput,
            inputPrice: newInputPrice,
            outputPrice: newOutputPrice,
            totalPrice: newTotalPrice
        });
        
        // Update totals
        this.totalTokens.input += (inputTokens || 0);
        this.totalTokens.output += (outputTokens || 0);
        this.totalTokens.inputPrice += (inputTokens || 0) * prices.input;
        this.totalTokens.outputPrice += (outputTokens || 0) * prices.output;
        this.updateTotalTokenDisplay();
    }

    updateTotalTokenDisplay() {
        const totalDisplay = document.getElementById('tokenUsageTotal');
        if (!totalDisplay) return;

        // Get current model prices
        const prices = this.modelPrices[this.selectedModel] || { input: 0, output: 0 };

        // Calculate total prices
        const inputPrice = (this.totalTokens.input || 0) * prices.input;
        const outputPrice = (this.totalTokens.output || 0) * prices.output;
        const totalPrice = inputPrice + outputPrice;

        // Update display elements with safe values
        const elements = {
            'total-input-tokens': this.totalTokens.input || 0,
            'total-output-tokens': this.totalTokens.output || 0,
            'total-tokens': (this.totalTokens.input || 0) + (this.totalTokens.output || 0),
            'total-input-price': `$${inputPrice.toFixed(4)}`,
            'total-output-price': `$${outputPrice.toFixed(4)}`,
            'total-price': `$${totalPrice.toFixed(4)}`
        };

        // Update each element if it exists
        for (const [className, value] of Object.entries(elements)) {
            const element = totalDisplay.querySelector(`.${className}`);
            if (element) {
                element.textContent = value;
            }
        }
    }

    async generateCombinedCharacter(generator, firstCharacter, secondCharacter, index) {
        const progressCell = document.getElementById(`progress-${index}`);
        const previewContainer = progressCell.querySelector('.character-preview-wrapper');
        
        try {
            // Get all progress steps
            const steps = progressCell.querySelectorAll('.progress-step');
            const planningStep = steps[0];
            const generatingStep = steps[1];
            const finalizingStep = steps[2];

            // Plan the character parts
            planningStep.querySelector('.planningNotes').textContent = 'Planning character combination...';
            
            // Create a detailed description of both parent characters
            const parentDescription = {
                firstCharacter: {
                    name: firstCharacter.name,
                    description: firstCharacter.metadata?.description || 'No description available',
                    parts: firstCharacter.shapes.map(shape => ({
                        name: shape.type,
                        color: shape.color,
                        shape: shape.type,
                        position: { x: shape.x, y: shape.y }
                    }))
                },
                secondCharacter: {
                    name: secondCharacter.name,
                    description: secondCharacter.metadata?.description || 'No description available',
                    parts: secondCharacter.shapes.map(shape => ({
                        name: shape.type,
                        color: shape.color,
                        shape: shape.type,
                        position: { x: shape.x, y: shape.y }
                    }))
                }
            };

            const plan = await generator.planCharacterCombination(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                parentDescription,
                this.selectedModel
            );
            
            // Update token count from planning
            if (plan && plan.usage) {
                this.updateTokenDisplay(index, plan.usage.prompt_tokens || plan.usage.input_tokens || 0, plan.usage.completion_tokens || plan.usage.output_tokens || 0);
            }
            
            planningStep.querySelector('.planningNotes').textContent = plan.design_notes;

            // Show the "Generating Parts" step now that we're starting generation
            generatingStep.classList.remove('hidden');

            // Generate each part in sequence
            let isComplete = false;
            const totalParts = plan.parts.length;
            let currentPartIndex = 0;

            while (!isComplete) {
                const currentPart = plan.parts[currentPartIndex];
                generatingStep.querySelector('.currentPart').textContent = `Generating ${currentPart.name}...`;
                generatingStep.querySelector('.partProgress').style.setProperty('--progress-width', `${((currentPartIndex + 1) / totalParts) * 100}%`);

                const result = await generator.generateNextPart(
                    this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                    plan.prompt,
                    this.selectedModel
                );
                
                // Update token count from part generation
                if (result && result.usage) {
                    this.updateTokenDisplay(index, result.usage.prompt_tokens || result.usage.input_tokens || 0, result.usage.completion_tokens || result.usage.output_tokens || 0);
                }

                // Update the preview after each part
                if (generator.currentCharacter) {
                    let canvas = previewContainer.querySelector('canvas');
                    if (!canvas) {
                        canvas = document.createElement('canvas');
                        previewContainer.appendChild(canvas);
                    }
                    generator.currentCharacter.render(canvas);
                }

                isComplete = result.isComplete;
                currentPartIndex++;
            }

            return generator.currentCharacter;
        } catch (error) {
            console.error(`Error generating combined character ${index}:`, error);
            if (progressCell) {
                const steps = progressCell.querySelectorAll('.progress-step');
                if (steps[0]) steps[0].querySelector('.planningNotes').textContent = 'Error occurred during planning.';
                if (steps[1]) steps[1].querySelector('.currentPart').textContent = '';
                if (steps[2]) steps[2].querySelector('.finalizingNotes').textContent = 'Generation failed.';
            }
            throw error;
        }
    }

    // Add method to handle character click and save
    handleCharacterClick(character) {
        if (!character) return;

        const confirmation = confirm(`Would you like to save this character named "${character.name}"?`);
        if (confirmation) {
            // Check if character already exists in saved characters
            const existingIndex = this.savedCharacters.findIndex(c => c.id === character.id);
            if (existingIndex === -1) {
                // Add to saved characters
                this.savedCharacters.push(character);
                this.saveTolocalStorage();
                
                // Remove from progress cells
                const progressCells = document.querySelectorAll('.progress-cell');
                progressCells.forEach(cell => {
                    const previewContainer = cell.querySelector('.character-preview-wrapper');
                    if (previewContainer && previewContainer.querySelector('canvas')) {
                        const canvas = previewContainer.querySelector('canvas');
                        if (canvas && canvas.dataset.characterId === character.id) {
                            previewContainer.innerHTML = '<div class="character-spinner"></div>';
                        }
                    }
                });
                
                // Update saved characters display
                this.displaySavedCharacters();
                
                alert('Character saved successfully!');
            } else {
                alert('This character is already saved!');
            }
        }
    }

    async combineCharacters(firstCharacter, secondCharacter) {
        if (!firstCharacter || !secondCharacter) {
            alert('Invalid characters selected for combination');
            return;
        }

        // Reset UI state
        document.getElementById('generationProgress').classList.remove('hidden');
        document.getElementById('loadingIndicator').classList.remove('hidden');

        // Clear previous characters array
        this.characters = [];

        try {
            // Reset token counters
            this.totalTokens = { input: 0, output: 0 };
            document.getElementById('tokenUsageTotal').classList.remove('hidden');
            this.updateTotalTokenDisplay();

            // Reset and hide all progress steps initially
            document.querySelectorAll('.progress-cell').forEach(cell => {
                // Reset token counters
                cell.querySelector('.input-tokens').textContent = '0';
                cell.querySelector('.output-tokens').textContent = '0';
                
                // Find all progress steps
                const steps = cell.querySelectorAll('.progress-step');
                steps.forEach((step, index) => {
                    if (index === 0) {
                        // Show planning step
                        step.classList.remove('hidden');
                        step.querySelector('.planningNotes').textContent = 'Planning character combination...';
                    } else {
                        // Hide other steps
                        step.classList.add('hidden');
                    }
                });

                // Clear any existing text
                const currentPart = cell.querySelector('.currentPart');
                const partProgress = cell.querySelector('.partProgress');
                const finalizingNotes = cell.querySelector('.finalizingNotes');
                
                if (currentPart) currentPart.textContent = '';
                if (partProgress) partProgress.style.setProperty('--progress-width', '0%');
                if (finalizingNotes) finalizingNotes.textContent = '';
            });

            // Create 6 generators with different interaction types
            const interactionTypes = [
                'transformation',    // One character transforms the other
                'fusion',           // Characters merge into a new form
                'conflict',         // Characters fight/compete, showing the result
                'symbiosis',        // Characters work together in harmony
                'corruption',       // One character corrupts/influences the other
                'evolution'         // Characters evolve into something new
            ];

            const generators = Array.from({ length: 6 }, (_, index) => {
                const generator = new CharacterGenerator();
                generator.gridSize = this.gridSize;
                generator.enableCircles = this.enableCircles;
                generator.interactionType = interactionTypes[index];
                return generator;
            });

            // Create a generation prompt that includes parent information and interaction type
            const generationPrompt = `Combine ${firstCharacter.name} (${firstCharacter.metadata?.description || 'No description available'}) with ${secondCharacter.name} (${secondCharacter.metadata?.description || 'No description available'})`;

            // Generate all characters in parallel
            const characterPromises = generators.map((generator, index) => 
                this.generateCombinedCharacter(generator, firstCharacter, secondCharacter, index)
                    .then(character => {
                        if (character) {
                            // Set parent information and generation prompt on the character
                            character.parents = {
                                firstParent: {
                                    id: firstCharacter.id,
                                    name: firstCharacter.name
                                },
                                secondParent: {
                                    id: secondCharacter.id,
                                    name: secondCharacter.name
                                }
                            };
                            character.generationPrompt = generationPrompt;
                            character.interactionType = generator.interactionType;
                            return this.finalizeSingleCharacter(generator, generationPrompt, index, character);
                        }
                        return null;
                    })
                    .catch(error => {
                        console.error(`Error with character ${index}:`, error);
                        return null;
                    })
            );

            // Wait for all characters to complete
            this.characters = (await Promise.all(characterPromises)).filter(char => char !== null);

            // Automatically save all generated characters
            if (this.characters.length > 0) {
                this.characters.forEach(character => {
                    this.savedCharacters.push(character);
                });
                this.saveTolocalStorage();
                this.displaySavedCharacters();
            }
        } catch (error) {
            console.error('Error combining characters:', error);
            alert('Error combining characters. Please try again.');
        } finally {
            document.getElementById('loadingIndicator').classList.add('hidden');
        }
    }
}

class StatRoller {
    static rollStat() {
        const roll = Math.random() * 1000;
        
        // 1% chance for legendary roll (70-100)
        if (roll <= 10) {
            return Math.floor(Math.random() * 31) + 70;  // 70-100
        }
        
        // 9% chance for rare roll (40-80)
        if (roll <= 100) {
            return Math.floor(Math.random() * 41) + 40;  // 40-80
        }
        
        // 90% chance for common roll (1-50)
        return Math.floor(Math.random() * 50) + 1;  // 1-50
    }

    static generateStats() {
        return {
            strength: this.rollStat(),
            dexterity: this.rollStat(),
            constitution: this.rollStat(),
            intelligence: this.rollStat(),
            wisdom: this.rollStat(),
            charisma: this.rollStat()
        };
    }
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.characterGenerator = new PixelCharacterGenerator();
    window.itemGenerator = new ItemGenerator();
}); 