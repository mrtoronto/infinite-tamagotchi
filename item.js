class Item {
    constructor(shapes = [], name = '', gridSize = 128, generationPrompt = '') {
        this.id = crypto.randomUUID();
        this.shapes = Array.isArray(shapes) ? shapes : [];
        this.name = name;
        this.gridSize = gridSize;
        this.generationPrompt = generationPrompt;
        this.metadata = null;
    }

    createPreviewElement(isSelectable = false) {
        const container = document.createElement('div');
        container.className = 'item-card';
        if (isSelectable) {
            container.dataset.itemId = this.id;
            container.addEventListener('click', () => this.handleSelection(container));
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.gridSize;
        canvas.height = this.gridSize;
        this.render(canvas);

        const nameElement = document.createElement('div');
        nameElement.className = 'item-name';
        nameElement.textContent = this.name || 'Unnamed Item';

        container.appendChild(canvas);
        container.appendChild(nameElement);
        return container;
    }

    handleSelection(element) {
        // Remove selection from other items
        document.querySelectorAll('.item-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // Select this item
        element.classList.add('selected');

        // Show save section
        const saveSection = document.getElementById('itemSaveSection');
        saveSection.classList.remove('hidden');
    }

    render(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.shapes && this.shapes.length > 0) {
            this.shapes.forEach(shape => {
                ctx.fillStyle = shape.color;
                // If the shape has been transformed (has a scale property), don't apply grid size scaling
                if (shape.scale) {
                    // For transformed shapes, we need to scale to the canvas size
                    const scale = canvas.width / this.gridSize;
                    ctx.fillRect(
                        shape.x * scale,
                        shape.y * scale,
                        shape.width * scale,
                        shape.height * scale
                    );
                } else {
                    // For untransformed shapes, apply grid size scaling
                    ctx.fillRect(
                        shape.x * (canvas.width / this.gridSize),
                        shape.y * (canvas.height / this.gridSize),
                        shape.width * (canvas.width / this.gridSize),
                        shape.height * (canvas.height / this.gridSize)
                    );
                }
            });
        }
    }

    toJSON() {
        return {
            id: this.id,
            shapes: this.shapes,
            name: this.name,
            gridSize: this.gridSize,
            metadata: this.metadata,
            generationPrompt: this.generationPrompt
        };
    }

    static fromJSON(data) {
        const item = new Item(data.shapes, data.name, data.gridSize, data.generationPrompt);
        item.id = data.id;
        item.metadata = data.metadata;
        return item;
    }
}

class ItemStatRoller {
    static getRarityFromRoll() {
        const roll = Math.random() * 1000; // Use 1000 for more precise percentages
        
        // 0.1% chance for mythical (1 in 1000)
        if (roll <= 1) return 'Mythical';
        // 0.9% chance for legendary (9 in 1000)
        if (roll <= 10) return 'Legendary';
        // 9% chance for rare (90 in 1000)
        if (roll <= 100) return 'Rare';
        // 40% chance for common (400 in 1000)
        if (roll <= 500) return 'Common';
        // 50% chance for mundane (500 in 1000)
        return 'Mundane';
    }

    static rollStatForRarity(rarity) {
        // For mundane items, always return 0
        if (rarity === 'Mundane') return 0;

        // For other rarities, roll within their constraints
        const roll = Math.random();
        switch (rarity) {
            case 'Mythical':
                return Math.floor(Math.random() * 41) + 20; // 20 to 60
            case 'Legendary':
                return Math.floor(Math.random() * 11) + 10; // 10 to 20
            case 'Rare':
                return Math.floor(Math.random() * 7) + 4;   // 4 to 10
            case 'Common':
                // 50% chance for positive or negative
                const isPositive = Math.random() < 0.5;
                const value = Math.floor(Math.random() * 4) + 1; // 1 to 4
                return isPositive ? value : -value;
            default:
                return 0;
        }
    }

    static generateStats() {
        // First determine the item's rarity
        const rarity = this.getRarityFromRoll();
        
        // Then generate stats appropriate for that rarity
        const stats = {
            strength: this.rollStatForRarity(rarity),
            dexterity: this.rollStatForRarity(rarity),
            constitution: this.rollStatForRarity(rarity),
            intelligence: this.rollStatForRarity(rarity),
            wisdom: this.rollStatForRarity(rarity),
            charisma: this.rollStatForRarity(rarity),
            rarity: rarity
        };
        
        return stats;
    }
} 