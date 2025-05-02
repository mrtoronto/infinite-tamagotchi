import json
import os
import re
import requests
from local_settings import API_KEY

API_URL = "https://api.openai.com/v1/chat/completions"

def read_svg_file(filename):
    """Read the contents of an SVG file."""
    with open(filename, 'r') as f:
        return f.read()

def save_svg_file(filename, content):
    """Save SVG content to a file."""
    with open(filename, 'w') as f:
        f.write(content)

def analyze_svg_prompt(svg_content):
    """Generate prompts for analyzing the SVG and suggesting animations."""
    system_prompt = """You are an expert in SVG animation and character design. Your task is to analyze an SVG file and suggest appropriate animations that would bring the character to life in a natural and appealing way.

Consider the following:
1. The character's components and their relationships
2. Natural, organic movements that would make sense for this character (wiggles, jiggles, subtle bounces)
3. Technical feasibility of the animations
4. The overall aesthetic and style of the character
5. How different parts should move in relation to each other (some parts leading, others following)
6. The nature and function of each element (e.g., eyes should have subtle movements, while larger body parts can have more pronounced motion)

IMPORTANT: 
- Focus on subtle, organic movements rather than dramatic transformations
- Consider the natural range of motion for each element (e.g., eyes blink, ears wiggle, body sways)
- Ensure movement scales are proportional to the element's size and function
- More rigid elements should have smaller movements than flexible ones
- Facial features should have the most subtle movements to maintain character expression

Return ONLY a JSON object with:
{
    "animations": [
        {
            "element_id": "id of the SVG element to animate",
            "animation_type": "type of animation (e.g., 'translate', 'rotate', 'scale', 'color')",
            "description": "brief description of the animation",
            "parameters": {
                "keyframes": [
                    {
                        "offset": "0%",
                        "value": "starting value"
                    },
                    {
                        "offset": "25%",
                        "value": "intermediate value"
                    },
                    {
                        "offset": "50%",
                        "value": "peak value"
                    },
                    {
                        "offset": "75%",
                        "value": "intermediate value"
                    },
                    {
                        "offset": "100%",
                        "value": "ending value"
                    }
                ],
                "duration": "duration in seconds",
                "repeat": "number of times to repeat (or 'infinite')",
                "delay": "delay in seconds before starting (for synchronization)",
                "movement_scale": "small/medium/large (relative to element's natural range of motion)"
            }
        }
    ],
    "overall_strategy": "brief description of the overall animation approach",
    "synchronization": {
        "groups": [
            {
                "name": "name of synchronized group",
                "elements": ["element_id1", "element_id2"],
                "description": "how these elements move together"
            }
        ]
    }
}

Example format (return ONLY the JSON, no other text):
{
    "animations": [
        {
            "element_id": "eye",
            "animation_type": "scale",
            "description": "subtle blinking motion",
            "parameters": {
                "keyframes": [
                    {"offset": "0%", "value": "1"},
                    {"offset": "25%", "value": "0.95"},
                    {"offset": "50%", "value": "0.9"},
                    {"offset": "75%", "value": "0.95"},
                    {"offset": "100%", "value": "1"}
                ],
                "duration": "3",
                "repeat": "infinite",
                "delay": "0",
                "movement_scale": "small"
            }
        }
    ],
    "overall_strategy": "Create gentle, organic movements that suggest the character is alive and breathing",
    "synchronization": {
        "groups": [
            {
                "name": "eyes",
                "elements": ["left_eye", "right_eye"],
                "description": "Eyes blink in sync with subtle, minimal movement"
            }
        ]
    }
}"""

    user_prompt = f"""Please analyze this SVG file and suggest appropriate animations. Focus on subtle, organic movements that make the character feel alive, with movements proportional to each element's natural range of motion:

{svg_content}"""

    return system_prompt, user_prompt

def generate_animated_svg_prompt(svg_content, animation_plan):
    """Generate prompts for creating the animated SVG."""
    system_prompt = """You are an expert in SVG animation implementation. Your task is to take an SVG file and an animation plan, and modify the SVG to include the specified animations using SVG animation elements.

You should:
1. Keep all existing SVG elements and their attributes
2. Add appropriate animation elements (animate, animateTransform, etc.)
3. Use keyframes for smooth, organic movements
4. Implement proper synchronization between elements
5. Maintain the original visual appearance when not animated
6. Use transform-origin appropriately for natural movement
7. Ensure animations are subtle and organic, not dramatic
8. Respect the natural range of motion for each element
9. Scale movements appropriately (e.g., eyes should have minimal movement, while larger body parts can move more)
10. Ensure facial features maintain their character and expression

Return ONLY the complete SVG file with the animations added. Do not include any other text or explanation.

Example format (return ONLY the SVG, no other text):
<svg ...>
    <rect id="eye" ... transform-origin="center">
        <animateTransform attributeName="transform" type="scale" 
            values="1;0.95;0.9;0.95;1" keyTimes="0;0.25;0.5;0.75;1" 
            dur="3s" repeatCount="indefinite"/>
    </rect>
</svg>"""

    user_prompt = f"""Please modify this SVG file to include the following animations. Focus on creating subtle, organic movements that respect each element's natural range of motion:

Original SVG:
{svg_content}

Animation Plan:
{json.dumps(animation_plan, indent=2)}"""

    return system_prompt, user_prompt

def make_openai_request(prompt, temperature=0.7):
    """Make a request to the OpenAI API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    
    if isinstance(prompt, tuple):
        system_prompt, user_prompt = prompt
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    else:
        messages = [{"role": "user", "content": prompt}]
    
    data = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": temperature
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response text: {e.response.text}")
        return None

def parse_animation_plan(response):
    """Parse the OpenAI response for animation plan."""
    if not response:
        return None
        
    try:
        content = response['choices'][0]['message']['content']
        print(f"Raw animation plan response: {content}")
        
        # Extract JSON from response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start == -1 or json_end == 0:
            print("No JSON found in response")
            return None
            
        json_str = content[json_start:json_end]
        print(f"Extracted JSON: {json_str}")
        
        return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing response: {e}")
        return None

def main():
    # Get input SVG filename
    input_filename = input("Enter the path to the SVG file to animate: ")
    
    # Read the SVG file
    svg_content = read_svg_file(input_filename)
    
    # Step 1: Analyze SVG and get animation plan
    print("\nAnalyzing SVG and planning animations...")
    analysis_prompt = analyze_svg_prompt(svg_content)
    analysis_response = make_openai_request(analysis_prompt, temperature=0.7)
    
    animation_plan = parse_animation_plan(analysis_response)
    if not animation_plan:
        print("Failed to generate animation plan")
        return
    
    print("\nAnimation Plan:")
    print(json.dumps(animation_plan, indent=2))
    
    # Step 2: Generate animated SVG
    print("\nGenerating animated SVG...")
    generation_prompt = generate_animated_svg_prompt(svg_content, animation_plan)
    generation_response = make_openai_request(generation_prompt, temperature=0.0)
    
    if not generation_response:
        print("Failed to generate animated SVG")
        return
    
    animated_svg = generation_response['choices'][0]['message']['content']
    
    # Save the animated SVG
    base_filename = os.path.splitext(input_filename)[0]
    output_filename = f"{base_filename}_animated.svg"
    save_svg_file(output_filename, animated_svg)
    
    print(f"\nAnimated SVG saved to: {output_filename}")

if __name__ == "__main__":
    main() 