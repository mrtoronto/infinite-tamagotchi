# Infinite Tamagotchi

A creative pixel art character generator that uses AI to create unique, interactive characters with RPG-like stats and equipment systems.

<img width="1328" alt="image" src="https://github.com/user-attachments/assets/a36aa4e0-1bc3-44be-a730-b032a4276dea" />


**Try it now: [https://mrtoronto.github.io/infinite-tamagotchi/](https://mrtoronto.github.io/infinite-tamagotchi/)**

## Features

### Character Generation
- Generate unique pixel art characters from text descriptions
- AI-powered design system that creates cohesive, visually appealing characters
- Multiple generation options:
  - Grid sizes from 32x32 to 2048x2048 (64x64 recommended for best visual results)
  - Optional circle shapes for organic designs
  - Generates 6 variations per prompt

### Character Customization
- Each character comes with:
  - Unique name and description
  - RPG-style stats (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma)
  - Equipment slots based on character design
  - Detailed design notes and planning

### Character Interaction
- Combine characters to create unique offspring
- Multiple interaction types:
  - Transformation
  - Fusion
  - Conflict
  - Symbiosis
  - Corruption
  - Evolution

### Visual Features
- High-quality pixel art rendering
- Customizable preview background colors
- Downloadable PNG exports
- Pixel-perfect rendering with shape layering

## Screenshots

### Character Generation
<img width="605" alt="image" src="https://github.com/user-attachments/assets/8135fd26-3a36-4bcf-9fce-be365e45ee1c" />

<img width="600" alt="image" src="https://github.com/user-attachments/assets/3137c2a4-e233-4db8-a726-ebd1f16386c3" />



### Character Details
<img width="897" alt="image" src="https://github.com/user-attachments/assets/2d8e90f4-e817-4621-b890-a1cf8832d0ee" />


### Character Combination
<img width="1253" alt="image" src="https://github.com/user-attachments/assets/464bd4a9-e722-461e-85f2-5afd7c323742" />

<img width="591" alt="image" src="https://github.com/user-attachments/assets/9e4ac673-6b1e-4942-8cf9-234dd7681f49" />



## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/infinite-tamagotchi.git
cd infinite-tamagotchi
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your API keys:
   - Get an OpenAI API key from [OpenAI](https://platform.openai.com)
   - (Optional) Get a Groq API key from [Groq](https://groq.com)
   - Add your keys in the web interface

4. Open index.html in your web browser to start generating characters!

## Requirements

- Python 3.x
- Modern web browser with JavaScript enabled
- OpenAI API key (or Groq API key)

Python Dependencies:
- requests==2.31.0
- numpy==1.24.3
- Pillow==10.0.0
- matplotlib==3.7.1

## Usage

### Recommended Settings
- **Model Selection:**
  - `gpt-4o`: Best quality results, slower generation
  - `gpt-4o-mini`: Fast generation with good results (recommended for most users)
  - Llama models: Available through Groq API
- **Grid Size:** 64x64 provides the best balance of detail and aesthetic appeal
- **Circles:** Enable for more organic-looking characters

### Basic Steps
1. Enter your API key(s) in the settings section
2. Choose your preferred model (GPT-4, GPT-4-mini, or Llama models)
3. Select grid size and shape options
4. Enter a character description
5. Click "Generate Character" to create variations
6. Save your favorite characters
7. View character details and equip items
8. Combine characters to create unique offspring

### Note on Items
The item generation system is currently in early development. While technically implemented, it may not produce optimal results. Character generation and combination features are more refined and recommended for the best experience.

## Technical Details

The project uses a sophisticated AI system to:
- Plan character designs with cohesive parts
- Generate pixel art using geometric shapes
- Create character stats and equipment slots
- Analyze character traits and abilities
- Combine characters with different interaction types

The pixel art generation system uses:
- Layered shapes with z-indexing
- Color theory for visual appeal
- Geometric composition principles
- Advanced shape manipulation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments

- OpenAI for their powerful GPT models
- Groq for their Llama model implementations
- The pixel art community for inspiration
