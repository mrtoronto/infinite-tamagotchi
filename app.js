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
        this.initializeUI();
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
        document.getElementById('saveCharacter').addEventListener('click', () => this.saveSelectedCharacter());

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
        document.getElementById('saveSection').classList.add('hidden');
        document.getElementById('generationProgress').classList.remove('hidden');
        document.getElementById('loadingIndicator').classList.remove('hidden');

        // Clear previous characters array
        this.characters = [];

        try {
            // Create 6 generators
            const generators = Array.from({ length: 6 }, () => {
                const generator = new CharacterGenerator();
                generator.gridSize = this.gridSize;
                generator.enableCircles = this.enableCircles;
                return generator;
            });

            // Prepare character cells and progress cells
            const characterGrid = document.getElementById('characterGrid');
            characterGrid.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const characterCell = document.createElement('div');
                characterCell.className = 'character-cell';
                characterCell.id = `character-${i}`;
                characterGrid.appendChild(characterCell);
            }

            // Generate all characters in parallel
            this.characters = await Promise.all(generators.map((generator, index) => 
                this.generateSingleCharacter(generator, prompt, index)
            ));

            // Display all completed characters
            this.displayCharacters();
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
        const characterCell = document.getElementById(`character-${index}`);
        
        try {
            // Plan the character parts
            progressCell.querySelector('.planningNotes').textContent = 'Planning character parts...';
            const plan = await generator.planCharacterParts(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                prompt,
                this.selectedModel
            );
            progressCell.querySelector('.planningNotes').textContent = plan.design_notes;

            // Generate each part in sequence
            let isComplete = false;
            const totalParts = plan.parts.length;
            let currentPartIndex = 0;

            while (!isComplete) {
                const currentPart = plan.parts[currentPartIndex];
                progressCell.querySelector('.currentPart').textContent = `Generating ${currentPart.name}...`;
                progressCell.querySelector('.partProgress').style.setProperty('--progress-width', `${(currentPartIndex / totalParts) * 100}%`);

                const result = await generator.generateNextPart(
                    this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                    prompt,
                    this.selectedModel
                );
                
                // Update the display after each part
                if (generator.currentCharacter && characterCell) {
                    const previewElement = generator.currentCharacter.createPreviewElement(true);
                    characterCell.innerHTML = ''; // Clear previous preview
                    characterCell.appendChild(previewElement);
                }

                isComplete = result.isComplete;
                currentPartIndex++;
            }

            // Finalize the character
            progressCell.querySelector('.finalizingNotes').textContent = 'Making final adjustments...';
            const finalCharacter = await generator.finalizeCharacter(
                this.selectedModel.startsWith('llama') ? this.groqApiKey : this.apiKey,
                prompt,
                this.selectedModel
            );
            progressCell.querySelector('.finalizingNotes').textContent = 'Character complete!';
            progressCell.querySelector('.partProgress').style.setProperty('--progress-width', '100%');

            return finalCharacter;
        } catch (error) {
            console.error(`Error generating character ${index}:`, error);
            if (progressCell) {
                progressCell.querySelector('.planningNotes').textContent = 'Error occurred during planning.';
                progressCell.querySelector('.currentPart').textContent = '';
                progressCell.querySelector('.finalizingNotes').textContent = 'Generation failed.';
            }
            throw error;
        }
    }

    displayCharacters() {
        const grid = document.getElementById('characterGrid');
        grid.innerHTML = '';
        
        this.characters.forEach(character => {
            const element = character.createPreviewElement(true);
            grid.appendChild(element);
        });
    }

    async saveSelectedCharacter() {
        const selectedCard = document.querySelector('.character-card.selected');
        if (!selectedCard) {
            alert('Please select a character to save');
            return;
        }

        const characterId = selectedCard.dataset.characterId;
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            alert('Character not found');
            return;
        }

        const name = document.getElementById('characterName').value.trim();
        if (!name) {
            alert('Please enter a name for your character');
            return;
        }

        if (!this.apiKey) {
            alert('Please set your OpenAI API key first');
            return;
        }

        character.name = name;

        // Generate stats using our new probability-based system
        const rolls = StatRoller.generateStats();

        try {
            // Disable button and show spinner
            const saveButton = document.getElementById('saveCharacter');
            saveButton.disabled = true;
            saveButton.classList.add('loading');

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
                generationPrompt: character.generationPrompt // Store the original prompt in metadata
            };

            // Save character and redirect
            this.savedCharacters.push(character);
            this.saveTolocalStorage();
            this.displaySavedCharacters();

            // Reset UI
            document.getElementById('characterName').value = '';
            document.getElementById('saveSection').classList.add('hidden');
            selectedCard.classList.remove('selected');

            // Redirect to character details page
            window.location.href = `character-details.html?id=${character.id}`;

        } catch (error) {
            console.error('Error generating character details:', error);
            alert('Error generating character details. Please try again.');
            
            // Re-enable button and hide spinner
            const saveButton = document.getElementById('saveCharacter');
            saveButton.disabled = false;
            saveButton.classList.remove('loading');
        }
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
        grid.innerHTML = '';
        
        this.savedCharacters.forEach(character => {
            const container = document.createElement('div');
            container.className = 'saved-character-container';
            
            const element = character.createPreviewElement(false);
            
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View Details';
            viewButton.className = 'view-details-button';
            viewButton.addEventListener('click', () => {
                window.location.href = `character-details.html?id=${character.id}`;
            });
            
            container.appendChild(element);
            container.appendChild(viewButton);
            grid.appendChild(container);
        });
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