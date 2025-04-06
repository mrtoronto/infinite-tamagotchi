class CharacterDetails {
    constructor() {
        this.character = null;
        this.loadCharacter();
        this.initializeUI();
    }

    initializeUI() {
        // Initialize download button
        document.getElementById('downloadButton').addEventListener('click', () => this.downloadCharacterPNG());
        
        // Initialize delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Character';
        deleteButton.className = 'action-button delete-button';
        deleteButton.addEventListener('click', () => this.deleteCharacter());
        
        // Add delete button after download button
        document.getElementById('downloadButton').after(deleteButton);
    }

    loadCharacter() {
        // Get character ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');

        if (!characterId) {
            window.location.href = 'index.html';
            return;
        }

        // Load saved characters
        const savedCharacters = localStorage.getItem('saved_characters');
        if (!savedCharacters) {
            window.location.href = 'index.html';
            return;
        }

        const characters = JSON.parse(savedCharacters).map(charData => Character.fromJSON(charData));
        this.character = characters.find(char => char.id === characterId);

        if (!this.character) {
            window.location.href = 'index.html';
            return;
        }

        // Save initial state as version 0 if no versions exist
        if (this.character.imageVersions.length === 0) {
            this.character.addVersion(this.character.shapes);
        }

        this.displayCharacter();
        this.displayStats(this.character.metadata.stats);
        this.displayEquipment(this.character.metadata.equipmentSlots);
        this.displayDescription(this.character.metadata.description);
    }

    displayCharacter() {
        // Display character name
        document.getElementById('characterName').textContent = this.character.name;
        
        // Display generation prompts
        document.getElementById('generationPrompt').textContent = this.character.generationPrompt || 'No generation prompt available';
        document.getElementById('variationPrompt').textContent = this.character.variationPrompt || 'No variation prompt available';

        // Display character description
        document.getElementById('characterDescription').textContent = this.character.metadata.description;

        // Render character portrait
        const canvas = document.getElementById('characterPortrait');
        this.character.render(canvas);
    }

    displayStats(stats) {
        const grid = document.getElementById('statsGrid');
        grid.innerHTML = ''; // Clear existing stats

        // Calculate average and grade
        const statValues = Object.values(stats);
        const average = Math.round(statValues.reduce((a, b) => a + b, 0) / statValues.length);
        const grade = this.getGrade(average);

        // Create overall stat section
        const overallStat = document.createElement('div');
        overallStat.className = 'overall-stat';
        
        const overallLabel = document.createElement('div');
        overallLabel.className = 'overall-label';
        overallLabel.textContent = 'Overall Rating';

        const overallValue = document.createElement('div');
        overallValue.className = 'overall-value';
        
        const gradeSpan = document.createElement('span');
        gradeSpan.className = `grade grade-${grade.toLowerCase()}`;
        gradeSpan.textContent = grade;

        const averageSpan = document.createElement('span');
        averageSpan.className = 'average-value';
        averageSpan.textContent = `${average}`;

        overallValue.appendChild(gradeSpan);
        overallValue.appendChild(averageSpan);
        overallStat.appendChild(overallLabel);
        overallStat.appendChild(overallValue);
        grid.appendChild(overallStat);

        // Add divider
        const divider = document.createElement('div');
        divider.className = 'stats-divider';
        grid.appendChild(divider);

        // Display individual stats
        Object.entries(stats).forEach(([stat, value]) => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';

            const label = document.createElement('label');
            label.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);

            const statBar = document.createElement('div');
            statBar.className = 'stat-bar';

            const statFill = document.createElement('div');
            statFill.className = 'stat-fill';
            statFill.style.setProperty('--target-width', `${value}%`);
            statFill.classList.add('animate');

            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            statValue.textContent = value;

            statBar.appendChild(statFill);
            statBar.appendChild(statValue);
            statItem.appendChild(label);
            statItem.appendChild(statBar);
            grid.appendChild(statItem);
        });
    }

    getGrade(average) {
        if (average >= 80) return 'A';
        if (average >= 60) return 'B';
        if (average >= 40) return 'C';
        if (average >= 20) return 'D';
        return 'F';
    }

    displayEquipment(equipmentSlots) {
        const grid = document.getElementById('equipmentGrid');
        grid.innerHTML = ''; // Clear existing slots

        equipmentSlots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            slotElement.id = `slot-${slot.id}`;

            const label = document.createElement('label');
            label.textContent = slot.name;
            
            const description = document.createElement('div');
            description.className = 'slot-description';
            description.textContent = slot.description;

            const content = document.createElement('div');
            content.className = 'slot-content';
            
            if (slot.equipment) {
                content.textContent = slot.equipment.name;
                const unequipButton = document.createElement('button');
                unequipButton.textContent = 'Unequip';
                unequipButton.className = 'unequip-button';
                unequipButton.addEventListener('click', () => this.unequipItem(slot.id));
                content.appendChild(unequipButton);
            } else {
                content.textContent = 'Empty';
                const equipButton = document.createElement('button');
                equipButton.textContent = 'Equip';
                equipButton.className = 'equip-button';
                equipButton.addEventListener('click', () => this.showItemSelection(slot.id));
                content.appendChild(equipButton);
            }

            slotElement.appendChild(label);
            slotElement.appendChild(description);
            slotElement.appendChild(content);
            grid.appendChild(slotElement);
        });
    }

    displayDescription(description) {
        document.getElementById('characterDescription').textContent = description;
    }

    downloadCharacterPNG() {
        const canvas = document.getElementById('characterPortrait');
        const link = document.createElement('a');
        link.download = `${this.character.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    deleteCharacter() {
        if (confirm(`Are you sure you want to delete ${this.character.name}?`)) {
            // Load current saved characters
            const savedCharacters = JSON.parse(localStorage.getItem('saved_characters') || '[]');
            
            // Filter out the current character
            const updatedCharacters = savedCharacters.filter(char => char.id !== this.character.id);
            
            // Save back to localStorage
            localStorage.setItem('saved_characters', JSON.stringify(updatedCharacters));
            
            // Redirect back to main page
            window.location.href = 'index.html';
        }
    }

    async showItemSelection(slotId) {
        // Load saved items
        const savedItemsJson = localStorage.getItem('saved_items');
        if (!savedItemsJson) {
            alert('No items available to equip');
            return;
        }

        const savedItems = JSON.parse(savedItemsJson).map(itemData => Item.fromJSON(itemData));
        
        // Create modal for item selection
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeButton = document.createElement('span');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => modal.remove());
        
        const title = document.createElement('h2');
        title.textContent = 'Select Item to Equip';
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'items-grid';
        
        savedItems.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = 'item-card';
            
            const canvas = document.createElement('canvas');
            canvas.width = item.gridSize;
            canvas.height = item.gridSize;
            item.render(canvas);
            
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = item.name;
            
            itemCard.appendChild(canvas);
            itemCard.appendChild(name);
            itemCard.addEventListener('click', () => this.checkItemCompatibility(slotId, item));
            
            itemsGrid.appendChild(itemCard);
        });
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(itemsGrid);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    async checkItemCompatibility(slotId, item) {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please set your OpenAI API key first');
            return;
        }

        try {
            // Convert character and item to PNG and get base64
            const characterCanvas = document.createElement('canvas');
            characterCanvas.width = this.character.gridSize;
            characterCanvas.height = this.character.gridSize;
            this.character.render(characterCanvas);
            const characterBase64 = characterCanvas.toDataURL('image/png').split(',')[1];

            const itemCanvas = document.createElement('canvas');
            itemCanvas.width = item.gridSize;
            itemCanvas.height = item.gridSize;
            item.render(itemCanvas);
            const itemBase64 = itemCanvas.toDataURL('image/png').split(',')[1];

            const response = await LLMUtils.query(
                apiKey,
                Prompts.getItemCompatibilityPrompt(),
                [
                    {
                        type: 'text',
                        text: `Character: ${this.character.name}\nSlot: ${slotId}\nItem: ${item.name}\nItem Type: ${item.metadata.type}`
                    }
                ],
                { expectedSchema: Prompts.getItemCompatibilitySchema() },
                0.0
            );

            if (response.compatible) {
                if (confirm(`This item is compatible with the slot. Would you like to equip it?`)) {
                    await this.equipItem(slotId, item);
                }
            } else {
                alert(`This item is not compatible with this slot: ${response.reason}`);
            }
        } catch (error) {
            console.error('Error checking item compatibility:', error);
            alert('Error checking item compatibility. Please try again.');
        }
    }

    async equipItem(slotId, item) {
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please set your OpenAI API key first');
            return;
        }

        try {
            // Convert character and item to PNG and get base64
            const characterCanvas = document.createElement('canvas');
            characterCanvas.width = this.character.gridSize;
            characterCanvas.height = this.character.gridSize;
            this.character.render(characterCanvas);
            const characterBase64 = characterCanvas.toDataURL('image/png').split(',')[1];

            const itemCanvas = document.createElement('canvas');
            itemCanvas.width = item.gridSize;
            itemCanvas.height = item.gridSize;
            item.render(itemCanvas);
            const itemBase64 = itemCanvas.toDataURL('image/png').split(',')[1];

            // Generate 10 different combined images
            const combinedImages = await Promise.all(
                Array(10).fill(null).map(() => this.generateCombinedImage(apiKey, characterBase64, itemBase64, slotId, item))
            );

            // Filter out any failed generations
            const validImages = combinedImages.filter(img => img !== null);
            
            if (validImages.length === 0) {
                alert('Failed to generate combined images. Please try again.');
                return;
            }

            // Show image selection modal
            this.showImageSelection(validImages, slotId, item);
        } catch (error) {
            console.error('Error equipping item:', error);
            alert('Error equipping item. Please try again.');
        }
    }

    async generateCombinedImage(apiKey, characterBase64, itemBase64, slotId, item) {
        try {
            // Get the base character shapes (version 0)
            const baseCharacterShapes = this.character.imageVersions[0].shapes;
            
            const response = await LLMUtils.query(
                apiKey,
                Prompts.getCombinedImagePrompt(),
                [
                    {
                        type: 'text',
                        text: `Character: ${this.character.name}\nSlot: ${slotId}\nCharacter Grid Size: ${this.character.gridSize}\nItem Grid Size: ${item.gridSize}\nCharacter Shapes: ${JSON.stringify(baseCharacterShapes)}\nItem Shapes: ${JSON.stringify(item.shapes)}`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${characterBase64}`
                        }
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:image/png;base64,${itemBase64}`
                        }
                    }
                ],
                { expectedSchema: Prompts.getCombinedImageSchema(this.character.gridSize) },
                0.3,
                'gpt-4o-mini'
            );
            
            console.log('LLM Response:', response);
            
            // Apply the transformation to the item's shapes
            const transformedShapes = this.applyTransformation(item.shapes, response.transform);
            console.log('Transformed Shapes:', transformedShapes);
            
            // Combine base character shapes with transformed item shapes
            const combinedShapes = [...baseCharacterShapes, ...transformedShapes];
            console.log('Combined Shapes:', combinedShapes);
            
            return combinedShapes;
        } catch (error) {
            console.error('Error generating combined image:', error);
            return null;
        }
    }

    applyTransformation(shapes, transform) {
        // Handle both center coordinates and offsets
        let centerX, centerY;
        if (transform.centerX !== undefined && transform.centerY !== undefined) {
            centerX = transform.centerX;
            centerY = transform.centerY;
        } else if (transform.xOffset !== undefined && transform.yOffset !== undefined) {
            // Convert offsets to center coordinates
            const gridCenterX = this.character.gridSize / 2;
            const gridCenterY = this.character.gridSize / 2;
            centerX = gridCenterX + (transform.xOffset * this.character.gridSize);
            centerY = gridCenterY + (transform.yOffset * this.character.gridSize);
        } else {
            console.error('Invalid transform parameters:', transform);
            return shapes;
        }

        const { scale, rotation, zIndex } = transform;
        console.log('Applying transformation:', { scale, centerX, centerY, rotation, zIndex });
        
        // Convert rotation to radians
        const rotationRad = (rotation * Math.PI) / 180;
        
        // Calculate the item's bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(shape => {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + shape.width);
            maxY = Math.max(maxY, shape.y + shape.height);
        });
        
        // Calculate item's center and dimensions
        const itemCenterX = (minX + maxX) / 2;
        const itemCenterY = (minY + maxY) / 2;
        const itemWidth = maxX - minX;
        const itemHeight = maxY - minY;
        
        // Calculate the scaled dimensions, accounting for grid size difference
        const gridScale = this.character.gridSize / 128; // Convert from item's 128x128 to character's grid size
        const scaledWidth = (itemWidth * scale * gridScale);
        const scaledHeight = (itemHeight * scale * gridScale);
        
        // Calculate the top-left position of the scaled item
        const scaledTopLeftX = centerX - (scaledWidth / 2);
        const scaledTopLeftY = centerY - (scaledHeight / 2);
        
        return shapes.map(shape => {
            // Calculate shape's position relative to item's center
            const relativeX = shape.x - itemCenterX;
            const relativeY = shape.y - itemCenterY;
            
            // Apply rotation around item's center
            const rotatedX = relativeX * Math.cos(rotationRad) - relativeY * Math.sin(rotationRad);
            const rotatedY = relativeX * Math.sin(rotationRad) + relativeY * Math.cos(rotationRad);
            
            // Apply scale and grid size conversion
            const scaledX = rotatedX * scale * gridScale;
            const scaledY = rotatedY * scale * gridScale;
            
            // Calculate new dimensions
            const scaledShapeWidth = shape.width * scale * gridScale;
            const scaledShapeHeight = shape.height * scale * gridScale;
            
            // Calculate final position relative to the scaled item's top-left
            const finalShapeX = Math.round(scaledTopLeftX + scaledX + (scaledWidth / 2));
            const finalShapeY = Math.round(scaledTopLeftY + scaledY + (scaledHeight / 2));
            
            console.log('Shape transformation:', {
                original: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
                transformed: { x: finalShapeX, y: finalShapeY, width: scaledShapeWidth, height: scaledShapeHeight },
                center: { centerX, centerY },
                scaledTopLeft: { scaledTopLeftX, scaledTopLeftY },
                gridScale: gridScale,
                zIndex: zIndex
            });
            
            return {
                ...shape,
                x: finalShapeX,
                y: finalShapeY,
                width: Math.round(scaledShapeWidth),
                height: Math.round(scaledShapeHeight),
                scale: scale,
                z_index: zIndex // Apply the z-index to all shapes in the group
            };
        });
    }

    showImageSelection(images, slotId, item) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeButton = document.createElement('span');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => modal.remove());
        
        const title = document.createElement('h2');
        title.textContent = 'Select Combined Image';
        
        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'images-grid';
        
        images.forEach((shapes, index) => {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            
            const canvas = document.createElement('canvas');
            canvas.width = this.character.gridSize;
            canvas.height = this.character.gridSize;
            
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            shapes.forEach(shape => {
                ctx.fillStyle = shape.color;
                ctx.fillRect(
                    shape.x * (canvas.width / this.character.gridSize),
                    shape.y * (canvas.height / this.character.gridSize),
                    shape.width * (canvas.width / this.character.gridSize),
                    shape.height * (canvas.height / this.character.gridSize)
                );
            });
            
            imageCard.appendChild(canvas);
            imageCard.addEventListener('click', () => this.confirmImageSelection(shapes, slotId, item));
            
            imagesGrid.appendChild(imageCard);
        });
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(imagesGrid);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    async confirmImageSelection(shapes, slotId, item) {
        // Save current version before updating
        this.character.addVersion(this.character.shapes);
        
        // Update character with new shapes
        this.character.shapes = shapes;
        
        // Update equipment slot
        const slotIndex = this.character.metadata.equipmentSlots.findIndex(slot => slot.id === slotId);
        if (slotIndex !== -1) {
            this.character.metadata.equipmentSlots[slotIndex].equipment = {
                id: item.id,
                name: item.name,
                metadata: item.metadata
            };
        }
        
        // Save character
        const savedCharacters = JSON.parse(localStorage.getItem('saved_characters') || '[]');
        const characterIndex = savedCharacters.findIndex(char => char.id === this.character.id);
        if (characterIndex !== -1) {
            savedCharacters[characterIndex] = this.character.toJSON();
            localStorage.setItem('saved_characters', JSON.stringify(savedCharacters));
        }
        
        // Remove item from inventory
        const savedItems = JSON.parse(localStorage.getItem('saved_items') || '[]');
        const updatedItems = savedItems.filter(savedItem => savedItem.id !== item.id);
        localStorage.setItem('saved_items', JSON.stringify(updatedItems));
        
        // Refresh display
        this.displayCharacter();
        this.displayEquipment(this.character.metadata.equipmentSlots);
        
        // Close all modals
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }

    async unequipItem(slotId) {
        if (!confirm('Are you sure you want to unequip this item?')) {
            return;
        }

        // Find the slot
        const slotIndex = this.character.metadata.equipmentSlots.findIndex(slot => slot.id === slotId);
        if (slotIndex === -1) return;

        // Get the item being unequipped
        const item = this.character.metadata.equipmentSlots[slotIndex].equipment;
        if (!item) return;

        // Store the current version index before reverting
        const previousVersion = this.character.currentVersion - 1;
        
        // Make sure we have a valid previous version
        if (previousVersion < 0 || previousVersion >= this.character.imageVersions.length) {
            alert('No previous version found to revert to.');
            return;
        }

        // Revert to previous version
        this.character.revertToVersion(previousVersion);

        // Clear the equipment slot
        this.character.metadata.equipmentSlots[slotIndex].equipment = null;

        // Save character
        const savedCharacters = JSON.parse(localStorage.getItem('saved_characters') || '[]');
        const characterIndex = savedCharacters.findIndex(char => char.id === this.character.id);
        if (characterIndex !== -1) {
            savedCharacters[characterIndex] = this.character.toJSON();
            localStorage.setItem('saved_characters', JSON.stringify(savedCharacters));
        }

        // Load existing saved items to get the original item data
        const savedItems = JSON.parse(localStorage.getItem('saved_items') || '[]');
        const originalItem = savedItems.find(savedItem => savedItem.id === item.id);
        
        if (originalItem) {
            // Add item back to inventory with its original shapes and data
            savedItems.push(originalItem);
        } else {
            // If we can't find the original item, create a new Item instance with the metadata we have
            // Find the item's shapes in the current character's shapes
            const itemShapes = this.character.shapes.filter(shape => 
                shape.itemId === item.id || shape.equippedItemId === item.id
            );
            
            const newItem = new Item(itemShapes, item.name, 128, '');
            newItem.id = item.id;
            newItem.metadata = item.metadata;
            savedItems.push(newItem.toJSON());
        }
        
        localStorage.setItem('saved_items', JSON.stringify(savedItems));

        // Refresh display
        this.displayCharacter();
        this.displayEquipment(this.character.metadata.equipmentSlots);
    }
}

// Initialize the character details page when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.characterDetails = new CharacterDetails();
}); 