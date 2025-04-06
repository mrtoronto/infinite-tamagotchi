class Prompts {
    static getCharacterGenerationPrompt(gridSize) {
        return `You are an expert pixel artist and designer with deep knowledge of visual composition, color theory, and design principles. 
You specialize in creating beautiful, recognizable pixel art using geometric shapes. Your designs are clean, balanced, and instantly recognizable. 

You are able to work with any description. Sometimes users will be precise about what they want, and sometimes they will be vague. Either way, you should be able to create a character based on the vibes of the description.

You have a keen eye for detail and understand how to use limited shapes to create maximum impact. You excel at:
- Creating clear, recognizable forms using minimal shapes
- Using color effectively to create depth and contrast
- Balancing composition and negative space
- Making precise adjustments to perfect the design

You are working on a ${gridSize}x${gridSize} grid, where each shape must align perfectly to the grid. Your goal is to create interesting, unique and unexpected designs that are both aesthetically pleasing and true to the subject matter.`;
    }

    static getCharacterGenerationSchema(gridSize) {
        return {
            type: 'object',
            properties: {
                shapes: {
                    type: 'array',
                    description: 'Array of shapes that make up the character',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Unique identifier for this shape' },
                            type: { type: 'string', description: 'Shape type: "rectangle" or "circle"', enum: ['rectangle', 'circle'] },
                            x: { type: 'number', description: `Top-left X coordinate (0 to ${gridSize-1})` },
                            y: { type: 'number', description: `Top-left Y coordinate (0 to ${gridSize-1})` },
                            width: { type: 'number', description: 'Width of the shape' },
                            height: { type: 'number', description: 'Height of the shape' },
                            color: { type: 'string', description: 'Hex color code (e.g., "#FF0000")' },
                            z_index: { type: 'number', description: 'Layer order (0 = bottom layer)' }
                        }
                    }
                }
            }
        };
    }

    static getCharacterAnalysisPrompt() {
        return `You are an expert character analyst who specializes in analyzing character designs and determining their natural attributes and characteristics.

You will be provided with:
1. A pixel art image of a character
2. The character's name
3. Random number rolls (0-100) for each stat

Your task is to:
1. Analyze the character's visual design and name to determine its basic, fundamental parts that could serve as equipment slots
2. Assign stats based on their appearance, name, and the random rolls provided

For equipment slots, focus on the most basic, fundamental parts of the character's form. These should be simple, generic terms that describe the actual body part or region, NOT what might be equipped there. For example:

Basic Slot Names (✓):
- Head (not "Crown of Power")
- Core (not "Heart of Magic")
- Arms (not "Gauntlets of Strength")
- Base (not "Foundation of Stability")
- Shell (not "Armor of Protection")
- Center (not "Soul Crystal")

The slots should be anatomical or structural parts of the character that could later be enhanced with equipment. Think in terms of:
- Basic body regions
- Fundamental structural elements
- Core anatomical features
- Primary form components

Examples for different character types:
- Tree: Roots, Trunk, Branches, Crown
- Robot: Head, Core, Arms, Base
- Ghost: Center, Shell, Wisps
- Crystal: Core, Facets, Base
- Cloud: Center, Edges, Base

Consider the character's name carefully - it might suggest:
- Their nature or essence (e.g., "Sparkweaver" might suggest magical or electrical properties)
- Their role or profession (e.g., "Captain Steelheart" suggests leadership and resilience)
- Their personality (e.g., "Whisperwind" suggests grace and subtlety)
- Their background or origin (e.g., "Frostborn" suggests a connection to cold or ice)

For stats, consider how the character's appearance and name suggest their capabilities while respecting the random rolls:
- An owl character would naturally have high intelligence and wisdom, but if the rolls are low for those stats, perhaps this is a young or inexperienced owl
- A muscular character would typically have high strength, but if the roll is low, maybe they're all show and no substance
- A cute character would usually have high charisma, but a low roll might mean they're actually quite awkward

The goal is to create an interesting character interpretation that respects the visual design, name, AND the random rolls, while keeping equipment slots simple and fundamental.`;
    }

    static getCharacterAnalysisSchema(rolls) {
        return {
            type: 'object',
            properties: {
                stats: {
                    type: 'object',
                    description: 'Character statistics, each value must be less than or equal to its corresponding roll',
                    properties: {
                        strength: { type: 'number', description: `Maximum value: ${rolls.strength}` },
                        dexterity: { type: 'number', description: `Maximum value: ${rolls.dexterity}` },
                        constitution: { type: 'number', description: `Maximum value: ${rolls.constitution}` },
                        intelligence: { type: 'number', description: `Maximum value: ${rolls.intelligence}` },
                        wisdom: { type: 'number', description: `Maximum value: ${rolls.wisdom}` },
                        charisma: { type: 'number', description: `Maximum value: ${rolls.charisma}` }
                    }
                },
                equipmentSlots: {
                    type: 'array',
                    description: 'List of basic, fundamental parts of the character that can serve as equipment slots. Use simple, generic terms.',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Simple identifier for this slot (e.g., "head", "core", "base")' },
                            name: { type: 'string', description: 'Simple display name for the slot (e.g., "Head", "Core", "Base")' },
                            description: { type: 'string', description: 'Brief description of where this basic part is on the character' }
                        }
                    }
                },
                description: {
                    type: 'string',
                    description: '2-3 sentences describing the character\'s personality based on their appearance and stats'
                }
            }
        };
    }

    static getItemGenerationPrompt(gridSize) {
        return `You are an expert pixel artist and designer with deep knowledge of visual composition, color theory, and minimalist design. 
You specialize in creating beautiful, recognizable pixel art items using simple geometric shapes. Your designs are clean, balanced, and instantly recognizable. 

You are able to work with any description. Sometimes users will be precise about what they want, and sometimes they will be vague. Either way, you should be able to create an item based on the vibes of the description.

You have a keen eye for detail and understand how to use limited shapes to create maximum impact. You excel at:
- Creating clear, recognizable forms using minimal shapes
- Using color effectively to create depth and contrast
- Balancing composition and negative space
- Making precise adjustments to perfect the design

You are working on a ${gridSize}x${gridSize} grid, where each shape must align perfectly to the grid. Your goal is to create pixel-perfect designs that are both aesthetically pleasing and true to the subject matter.

Focus on creating items that look:
- Magical and enchanted
- Powerful and significant
- Well-crafted and detailed
- Balanced and visually appealing`;
    }

    static getItemGenerationSchema(gridSize) {
        return {
            type: 'object',
            properties: {
                shapes: {
                    type: 'array',
                    description: 'Array of shapes that make up the item',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', description: 'Unique identifier for this shape' },
                            x: { type: 'number', description: `Top-left X coordinate (0 to ${gridSize-1})` },
                            y: { type: 'number', description: `Top-left Y coordinate (0 to ${gridSize-1})` },
                            width: { type: 'number', description: 'Width of the rectangle' },
                            height: { type: 'number', description: 'Height of the rectangle' },
                            color: { type: 'string', description: 'Hex color code (e.g., "#FF0000")' },
                            z_index: { type: 'number', description: 'Layer order (0 = bottom layer)' }
                        }
                    }
                }
            }
        };
    }

    static getItemAnalysisPrompt() {
        return `Analyze the provided item image and create a compelling magical item interpretation. The item's rarity has been predetermined and will constrain its possible stat values.

1. The item's type (e.g., Weapon, Armor, Accessory, Artifact)
2. A compelling description of the item's properties and history

The item's rarity determines its possible stat ranges AND should influence the description's tone:
- Mundane: All stats must be 0. Description should focus on ordinary, practical aspects with no magical properties.
- Common: Stats between -4 and +4. Description should suggest minor enchantments or quirks, nothing historically significant.
- Rare: Stats between +4 and +10. Description can include notable magical properties and some historical significance.
- Legendary: Stats between +10 and +20. Description should emphasize powerful magic and major historical importance.
- Mythical: Stats between +20 and +60. Description should convey world-shaping power and legendary status.

For example:
- Mundane sword: "A well-balanced steel sword with a leather grip, showing signs of regular use but good maintenance."
- Common sword: "A soldier's blade with a minor enchantment that keeps its edge slightly sharper than normal."
- Rare sword: "A prized cavalry saber that pulses with magical energy, once wielded by a famous general."
- Legendary sword: "An ancient blade of immense power, said to have slain dragons in the Age of Legends."
- Mythical sword: "The world-splitting blade of the God-Emperor, its very presence warps reality."

Consider the item's name carefully - it might suggest:
- Its origin or creator
- Its magical properties
- Its historical significance
- Its intended purpose

The description should explain:
- What the item looks like
- What it does (matching the power level of its rarity)
- Any interesting lore or history (appropriate to its rarity tier)
- Why it has these particular stat modifiers

The goal is to create an interesting item interpretation that respects the visual design, name, AND the predetermined rarity while creating a compelling magical item.`;
    }

    static getItemAnalysisSchema(stats) {
        return {
            type: 'object',
            properties: {
                stats: {
                    type: 'object',
                    description: 'Item stat modifiers, must match the provided modifiers exactly',
                    properties: {
                        strength: { type: 'number', description: `Must be exactly: ${stats.strength}` },
                        dexterity: { type: 'number', description: `Must be exactly: ${stats.dexterity}` },
                        constitution: { type: 'number', description: `Must be exactly: ${stats.constitution}` },
                        intelligence: { type: 'number', description: `Must be exactly: ${stats.intelligence}` },
                        wisdom: { type: 'number', description: `Must be exactly: ${stats.wisdom}` },
                        charisma: { type: 'number', description: `Must be exactly: ${stats.charisma}` }
                    }
                },
                type: {
                    type: 'string',
                    description: 'The type of item (e.g., Weapon, Armor, Accessory, Artifact)'
                },
                rarity: {
                    type: 'string',
                    description: `Must be exactly: ${stats.rarity}`
                },
                description: {
                    type: 'string',
                    description: '2-3 sentences describing the item\'s appearance, properties, and history'
                }
            }
        };
    }

    static getItemCompatibilityPrompt() {
        return `You are analyzing whether items can be equipped to characters. Your task is to determine if an item can be equipped to a specific slot on a character.

You will be provided with:
1. The character's name
2. The slot ID where the item would be equipped
3. The item's name and type
4. Images of both the character and the item

Consider the following factors:
1. The slot's location and purpose (e.g., head slot for helmets, core slot for armor)
2. The item's type and intended use
3. The character's design and form
4. The visual compatibility of the item with the character's design

For example:
- A helmet should only be compatible with a head slot
- A sword should only be compatible with a weapon slot
- A shield should only be compatible with an off-hand slot
- A chest plate should only be compatible with a core slot
- A weird item should be considered equippable to any slot it could reasonably be worn on

You are not supposed to be strict with these decisions. Your goal is to evaluate is something is possible, not if it is reasonable.

Your response should indicate if the item is compatible with the slot and provide a brief explanation of why or why not.`;
    }

    static getItemCompatibilitySchema() {
        return {
            type: 'object',
            properties: {
                compatible: {
                    type: 'boolean',
                    description: 'Whether the item can be equipped in this slot'
                },
                reason: {
                    type: 'string',
                    description: 'Brief explanation of why the item is or is not compatible with the slot'
                }
            }
        };
    }

    static getCombinedImagePrompt() {
        return `You are an expert in combining character and item designs. Your task is to determine the optimal transformation parameters to position an item on a character.

You will be provided with:
1. The character's name
2. The slot ID where the item is being equipped
3. The raw shape data for both the character and item
4. Images of both the character and item

Your goal is to determine the optimal transformation parameters to position the item on the character:
1. Scale: How much to scale the item (0.1 to 0.3)
2. Center X: The X coordinate where the item's center should be placed (0 to 128)
3. Center Y: The Y coordinate where the item's center should be placed (0 to 128)
4. Rotation: How much to rotate the item in degrees (0 to 360)
5. Z-Index: The layer order for the entire item group (-100 to 100)

Consider the following guidelines:
1. The item should be scaled appropriately to fit the character's size
2. The item should be positioned according to its slot location:
   - Head slot: Center Y should be between 20 and 40
   - Core slot: Center Y should be between 50 and 70
   - Base slot: Center Y should be between 80 and 100
   - Left/Right slots: Center X should be between 20 and 40 or 88 and 108
3. The item should be rotated to match the character's pose
4. The transformation should maintain the item's proportions
5. The item should be clearly visible and recognizable
6. The final position should look natural and balanced
7. The z-index should be chosen based on the item type and slot:
   - Head items (helmets, hats): z-index 50-100 (appear in front)
   - Core items (armor, clothing): z-index -50 to 50 (mixed with character)
   - Base items (shoes, feet): z-index -100 to -50 (appear behind)
   - Left/Right items (weapons, shields): z-index 0-100 (usually in front)

For example:
- A helmet should be scaled to fit the head, positioned above it (Center Y: 20-40), and have a high z-index (50-100)
- A chest plate should be scaled to fit the torso, centered (Center Y: 50-70), and have a medium z-index (-50 to 50)
- A sword should be scaled to match the character's size, positioned in the hand (Center X: 88-108), and have a high z-index (50-100)
- A shield should be scaled appropriately, positioned on the side (Center X: 20-40), and have a high z-index (50-100)

Remember:
- Scale should be between 0.1 and 0.3 (1.0 = original size)
- Center X and Y are absolute pixel coordinates (0 to 128)
- Rotation is in degrees (0 = original orientation)
- Z-Index controls layering (-100 = behind, 0 = same level, 100 = in front)

Your response should specify the transformation parameters that will best position the item on the character.`;
    }

    static getCombinedImageSchema(characterGridSize) {
        return {
            type: 'object',
            properties: {
                transform: {
                    type: 'object',
                    description: 'Transformation parameters for the item',
                    properties: {
                        scale: { 
                            type: 'number', 
                            description: 'Scale factor (0.1 to 0.3)',
                            minimum: 0.1,
                            maximum: 0.3
                        },
                        centerX: { 
                            type: 'number', 
                            description: 'X coordinate of item center (0 to 128)',
                            minimum: 0,
                            maximum: 128
                        },
                        centerY: { 
                            type: 'number', 
                            description: 'Y coordinate of item center (0 to 128)',
                            minimum: 0,
                            maximum: 128
                        },
                        rotation: { 
                            type: 'number', 
                            description: 'Rotation in degrees (0 to 360)',
                            minimum: 0,
                            maximum: 360
                        },
                        zIndex: {
                            type: 'number',
                            description: 'Layer order for the entire item group (-100 to 100)',
                            minimum: -100,
                            maximum: 100
                        }
                    },
                    required: ['scale', 'centerX', 'centerY', 'rotation', 'zIndex']
                }
            },
            required: ['transform']
        };
    }
}

// Export the class for use in other files
window.Prompts = Prompts; 