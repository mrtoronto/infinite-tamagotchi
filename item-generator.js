class ItemGenerator {
    constructor() {
        this.items = [];
        this.savedItems = this.loadSavedItems();
        this.selectedItem = null;
        this.initializeUI();
    }

    initializeUI() {
        // Initialize generation section
        document.getElementById('generateItems').addEventListener('click', () => this.generateItems());

        // Initialize save section
        document.getElementById('saveItem').addEventListener('click', () => this.saveSelectedItem());

        // Display saved items
        this.displaySavedItems();
    }

    async generateItems() {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please enter your OpenAI API key first');
            return;
        }

        const prompt = document.getElementById('itemPrompt').value.trim();
        if (!prompt) {
            alert('Please enter an item description');
            return;
        }

        const gridSize = parseInt(localStorage.getItem('grid_size') || '128');

        // Disable button and show spinner
        const generateButton = document.getElementById('generateItems');
        generateButton.disabled = true;
        generateButton.classList.add('loading');

        // Clear previous results
        document.getElementById('itemGrid').innerHTML = '';
        document.getElementById('itemSaveSection').classList.add('hidden');

        try {
            // Generate 10 different items
            const items = await Promise.all(
                Array(10).fill(null).map(() => this.generateSingleItem(prompt, apiKey, gridSize))
            );

            // Filter out any failed generations
            this.items = items.filter(item => item !== null);
            
            // Display the items
            this.displayItems();
        } catch (error) {
            console.error('Error generating items:', error);
            alert('Error generating items. Please try again.');
        } finally {
            // Re-enable button and hide spinner
            generateButton.disabled = false;
            generateButton.classList.remove('loading');
        }
    }

    async generateSingleItem(prompt, apiKey, gridSize) {
        try {
            const response = await LLMUtils.query(
                apiKey,
                Prompts.getItemGenerationPrompt(gridSize),
                `Please generate an item based on the following description: ${prompt}`,
                { expectedSchema: Prompts.getItemGenerationSchema(gridSize) }
            );
            
            return new Item(response.shapes, '', gridSize, prompt);
        } catch (error) {
            console.error('Error in item generation:', error);
            return null;
        }
    }

    displayItems() {
        const grid = document.getElementById('itemGrid');
        grid.innerHTML = '';
        
        this.items.forEach(item => {
            const element = item.createPreviewElement(true);
            grid.appendChild(element);
        });
    }

    async saveSelectedItem() {
        const selectedCard = document.querySelector('.item-card.selected');
        if (!selectedCard) {
            alert('Please select an item to save');
            return;
        }

        const itemId = selectedCard.dataset.itemId;
        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            alert('Item not found');
            return;
        }

        const name = document.getElementById('itemName').value.trim();
        if (!name) {
            alert('Please enter a name for your item');
            return;
        }

        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please set your OpenAI API key first');
            return;
        }

        item.name = name;

        // Generate stats using our new probability-based system
        const stats = ItemStatRoller.generateStats();

        try {
            // Disable button and show spinner
            const saveButton = document.getElementById('saveItem');
            saveButton.disabled = true;
            saveButton.classList.add('loading');

            // Convert item to PNG and get base64
            const canvas = document.createElement('canvas');
            const size = item.gridSize;
            canvas.width = size;
            canvas.height = size;
            item.render(canvas);
            const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

            const content = await LLMUtils.query(
                apiKey,
                Prompts.getItemAnalysisPrompt(),
                [
                    {
                        type: 'text',
                        text: `Please analyze this item named "${item.name}". This item was generated based on the concept: ${item.generationPrompt}. Generated stats are:\nStrength: ${stats.strength}\nDexterity: ${stats.dexterity}\nConstitution: ${stats.constitution}\nIntelligence: ${stats.intelligence}\nWisdom: ${stats.wisdom}\nCharisma: ${stats.charisma}\nRarity: ${stats.rarity}`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${imageBase64}`
                        }
                    }
                ],
                { expectedSchema: Prompts.getItemAnalysisSchema(stats) }
            );
            
            // Update item metadata
            item.metadata = {
                stats: content.stats,
                type: content.type,
                rarity: stats.rarity,
                description: content.description,
                generationPrompt: item.generationPrompt
            };

            // Save item and redirect
            this.savedItems.push(item);
            this.saveToLocalStorage();
            this.displaySavedItems();

            // Reset UI
            document.getElementById('itemName').value = '';
            document.getElementById('itemSaveSection').classList.add('hidden');
            selectedCard.classList.remove('selected');

            // Redirect to item details page
            window.location.href = `item-details.html?id=${item.id}`;

        } catch (error) {
            console.error('Error generating item details:', error);
            alert('Error generating item details. Please try again.');
            
            // Re-enable button and hide spinner
            const saveButton = document.getElementById('saveItem');
            saveButton.disabled = false;
            saveButton.classList.remove('loading');
        }
    }

    loadSavedItems() {
        const saved = localStorage.getItem('saved_items');
        if (!saved) return [];
        
        try {
            const data = JSON.parse(saved);
            return data.map(itemData => Item.fromJSON(itemData));
        } catch (error) {
            console.error('Error loading saved items:', error);
            return [];
        }
    }

    saveToLocalStorage() {
        const data = this.savedItems.map(item => item.toJSON());
        localStorage.setItem('saved_items', JSON.stringify(data));
    }

    displaySavedItems() {
        const grid = document.getElementById('savedItems');
        grid.innerHTML = '';
        
        this.savedItems.forEach(item => {
            const container = document.createElement('div');
            container.className = 'saved-item-container';
            
            const element = item.createPreviewElement(false);
            
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View Details';
            viewButton.className = 'view-details-button';
            viewButton.addEventListener('click', () => {
                window.location.href = `item-details.html?id=${item.id}`;
            });
            
            container.appendChild(element);
            container.appendChild(viewButton);
            grid.appendChild(container);
        });
    }
} 