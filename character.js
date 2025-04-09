class Character {
    constructor(shapes, name = '', gridSize = 128, generationPrompt = '', variationPrompt = '') {
        this.id = crypto.randomUUID();
        this.shapes = shapes;
        this.name = name;
        this.gridSize = gridSize;
        this.generationPrompt = generationPrompt; // Original prompt
        this.variationPrompt = variationPrompt; // Variation prompt used for this specific character
        this.metadata = null;
        this.imageVersions = []; // Store different versions of the character
        this.currentVersion = 0; // Index of current version
        this.parents = null; // Store parent character IDs if this is a combined character
        this.interactionType = null; // Store the type of interaction that created this character
    }

    // Convert character data to a storable format
    toJSON() {
        return {
            id: this.id,
            shapes: this.shapes,
            name: this.name,
            gridSize: this.gridSize,
            metadata: this.metadata,
            generationPrompt: this.generationPrompt,
            variationPrompt: this.variationPrompt,
            imageVersions: this.imageVersions,
            currentVersion: this.currentVersion,
            parents: this.parents
        };
    }

    // Create a character from stored data
    static fromJSON(data) {
        const character = new Character(data.shapes, data.name, data.gridSize, data.generationPrompt, data.variationPrompt);
        character.id = data.id;
        character.metadata = data.metadata;
        character.imageVersions = data.imageVersions || [];
        character.currentVersion = data.currentVersion || 0;
        character.parents = data.parents || null;
        return character;
    }

    // Scale shapes to match the current grid size
    scaleShapes(targetGridSize) {
        const scale = targetGridSize / this.gridSize;
        return this.shapes.map(shape => ({
            ...shape,
            x: Math.round(shape.x * scale),
            y: Math.round(shape.y * scale),
            width: Math.round(shape.width * scale),
            height: Math.round(shape.height * scale)
        }));
    }

    // Render character to a canvas element
    render(canvas) {
        const ctx = canvas.getContext('2d');
        const displaySize = 256; // Fixed display size
        
        // Set canvas size
        canvas.width = displaySize;
        canvas.height = displaySize;
        
        // Clear canvas
        ctx.clearRect(0, 0, displaySize, displaySize);
        
        // Sort shapes by z-index
        const sortedShapes = [...this.shapes].sort((a, b) => 
            (a.z_index || 0) - (b.z_index || 0)
        );
        
        // Calculate scale factor
        const scale = displaySize / this.gridSize;
        
        // Draw each shape
        for (const shape of sortedShapes) {
            // Convert hex color to RGB
            const color = shape.color;
            ctx.fillStyle = color;
            
            // Scale coordinates and dimensions
            const x = Math.round(shape.x * scale);
            const y = Math.round(shape.y * scale);
            const width = Math.round(shape.width * scale);
            const height = Math.round(shape.height * scale);
            
            if (shape.type === 'circle') {
                // Draw circle/ellipse
                ctx.beginPath();
                ctx.ellipse(
                    x + width/2,  // center x
                    y + height/2, // center y
                    width/2,      // radius x
                    height/2,     // radius y
                    0,            // rotation
                    0,            // start angle
                    2 * Math.PI   // end angle
                );
                ctx.fill();
            } else {
                // Draw rectangle (default)
                ctx.fillRect(x, y, width, height);
            }
        }
    }

    // Create a preview element
    createPreviewElement(selectable = true) {
        const container = document.createElement('div');
        container.className = 'character-card';
        container.dataset.characterId = this.id;

        const canvas = document.createElement('canvas');
        canvas.className = 'character-preview';
        this.render(canvas);

        const nameElement = document.createElement('p');
        nameElement.textContent = this.name || 'Unnamed Character';

        const sizeElement = document.createElement('small');
        sizeElement.textContent = `${this.gridSize}x${this.gridSize}`;
        sizeElement.style.color = '#666';

        container.appendChild(canvas);
        container.appendChild(nameElement);
        container.appendChild(sizeElement);

        if (selectable) {
            container.addEventListener('click', () => {
                // Remove selection from other cards
                document.querySelectorAll('.character-card').forEach(card => 
                    card.classList.remove('selected')
                );
                // Add selection to this card
                container.classList.add('selected');
                // Show save section
                document.getElementById('saveSection').classList.remove('hidden');
            });
        }

        return container;
    }

    // Add a new version of the character
    addVersion(shapes) {
        this.imageVersions.push({
            shapes: shapes,
            timestamp: new Date().toISOString()
        });
        this.currentVersion = this.imageVersions.length - 1;
        this.shapes = shapes; // Update current shapes
    }

    // Revert to a previous version
    revertToVersion(versionIndex) {
        if (versionIndex >= 0 && versionIndex < this.imageVersions.length) {
            this.shapes = this.imageVersions[versionIndex].shapes;
            this.currentVersion = versionIndex;
        }
    }
} 