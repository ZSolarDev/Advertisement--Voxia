// Thank you, Claude 3.7 Sonnet! (Only 1 error! So much smarter than ChatGPT! Only downside is that its a bit slower. I don't care, im just happy it's smart)
class MiniMessageConverter {
    constructor() {
      this.reset();
    }
  
    reset() {
      this.components = [];
      this.currentComponent = { text: "" };
      this.tagStack = [];
      this.currentText = "";
    }
  
    // Process MiniMessage input and return tellraw JSON
    convert(input) {
      this.reset();
      let i = 0;
      
      while (i < input.length) {
        // Handle tag opening
        if (input[i] === '<' && input[i+1] !== '/' && input[i+1] !== '!') {
          // Flush any accumulated text
          if (this.currentText) {
            this.currentComponent.text = this.currentText;
            this.components.push({...this.currentComponent});
            this.currentText = "";
          }
          
          // Find the tag end
          const tagEndIndex = input.indexOf('>', i);
          if (tagEndIndex === -1) {
            throw new Error("Unclosed tag starting at " + i);
          }
          
          // Extract tag content
          const tagContent = input.substring(i + 1, tagEndIndex);
          i = tagEndIndex + 1;
          
          // Process the tag
          this.processTag(tagContent);
          continue;
        }
        // Handle closing tag
        else if (input.substring(i, i+2) === '</') {
          // Flush any accumulated text
          if (this.currentText) {
            this.currentComponent.text = this.currentText;
            this.components.push({...this.currentComponent});
            this.currentText = "";
          }
          
          // Find the tag end
          const tagEndIndex = input.indexOf('>', i);
          if (tagEndIndex === -1) {
            throw new Error("Unclosed tag ending at " + i);
          }
          
          // Extract tag content
          const tagContent = input.substring(i + 2, tagEndIndex);
          i = tagEndIndex + 1;
          
          // Process the closing tag
          this.processClosingTag(tagContent);
          continue;
        }
        
        // Normal text
        this.currentText += input[i];
        i++;
      }
      
      // Handle any remaining text
      if (this.currentText) {
        this.currentComponent.text = this.currentText;
        this.components.push({...this.currentComponent});
      }
      
      // If there's only one component and it's just text, wrap it in the standard format
      if (this.components.length === 1 && Object.keys(this.components[0]).length === 1) {
        return JSON.stringify(["", ...this.components]);
      }
      
      return JSON.stringify(["", ...this.components]);
    }
    
    processTag(tagContent) {
      // Split tag to get name and arguments
      const [tagName, ...args] = tagContent.split(':');
      const tagLower = tagName.toLowerCase();
      
      // Handle different tag types
      switch (tagLower) {
        // Colors
        case 'red':
        case 'blue':
        case 'green':
        case 'yellow':
        case 'gold':
        case 'aqua':
        case 'white':
        case 'black':
        case 'gray':
        case 'grey':
        case 'dark_blue':
        case 'dark_green':
        case 'dark_aqua':
        case 'dark_red':
        case 'dark_purple':
        case 'dark_gray':
        case 'dark_grey':
        case 'light_purple':
          this.currentComponent.color = tagLower;
          this.tagStack.push({ type: 'color', value: tagLower });
          break;
          
        // Hex color
        case '#':
          const hexColor = tagContent;
          this.currentComponent.color = hexColor;
          this.tagStack.push({ type: 'color', value: hexColor });
          break;
          
        case 'color':
        case 'c':
          const colorValue = args[0] || "";
          if (colorValue.startsWith('#')) {
            this.currentComponent.color = colorValue;
          } else {
            this.currentComponent.color = colorValue;
          }
          this.tagStack.push({ type: 'color', value: colorValue });
          break;
          
        // Decorations
        case 'bold':
        case 'b':
          this.currentComponent.bold = true;
          this.tagStack.push({ type: 'decoration', value: 'bold' });
          break;
          
        case 'italic':
        case 'i':
        case 'em':
          this.currentComponent.italic = true;
          this.tagStack.push({ type: 'decoration', value: 'italic' });
          break;
          
        case 'underlined':
        case 'u':
          this.currentComponent.underlined = true;
          this.tagStack.push({ type: 'decoration', value: 'underlined' });
          break;
          
        case 'strikethrough': 
        case 'st':
          this.currentComponent.strikethrough = true;
          this.tagStack.push({ type: 'decoration', value: 'strikethrough' });
          break;
          
        case 'obfuscated':
        case 'obf':
          this.currentComponent.obfuscated = true;
          this.tagStack.push({ type: 'decoration', value: 'obfuscated' });
          break;
          
        // Click event
        case 'click':
          if (args.length >= 2) {
            const action = args[0];
            const value = args.slice(1).join(':');
            this.currentComponent.clickEvent = {
              action: action,
              value: this.stripQuotes(value)
            };
            this.tagStack.push({ type: 'clickEvent', value: 'click' });
          }
          break;
          
        // Hover event
        case 'hover':
          if (args.length >= 2) {
            const action = args[0];
            const value = args.slice(1).join(':');
            
            if (action === 'show_text') {
              this.currentComponent.hoverEvent = {
                action: action,
                contents: this.stripQuotes(value)
              };
            } else {
              this.currentComponent.hoverEvent = {
                action: action,
                value: this.stripQuotes(value)
              };
            }
            this.tagStack.push({ type: 'hoverEvent', value: 'hover' });
          }
          break;
  
        // Insert text
        case 'insertion':
        case 'insert':
          if (args.length >= 1) {
            const value = args.join(':');
            this.currentComponent.insertion = this.stripQuotes(value);
            this.tagStack.push({ type: 'insertion', value: 'insertion' });
          }
          break;
        
        // Reset
        case 'reset':
        case 'r':
          this.currentComponent = { text: "" };
          this.tagStack = [];
          break;
        
        // Newline
        case 'br':
        case 'newline':
        case 'nl':
          this.currentText += '\n';
          break;
          
        // Ignore unsupported tags or handle more tags as needed
        default:
          console.warn(`Unsupported tag: ${tagLower}`);
          break;
      }
    }
    
    processClosingTag(tagContent) {
      // Split tag to get name
      const [tagName] = tagContent.split(':');
      const tagLower = tagName.toLowerCase();
      
      // Find matching opening tag
      for (let i = this.tagStack.length - 1; i >= 0; i--) {
        const tag = this.tagStack[i];
        
        // Check if it's the correct tag type
        if ((tag.type === 'color' && this.isColorTag(tagLower)) ||
            (tag.type === 'decoration' && this.isDecorationTag(tagLower, tag.value)) ||
            (tag.type === 'clickEvent' && tagLower === 'click') ||
            (tag.type === 'hoverEvent' && tagLower === 'hover') ||
            (tag.type === 'insertion' && (tagLower === 'insertion' || tagLower === 'insert'))) {
          
          // Remove this tag and all nested tags
          this.tagStack = this.tagStack.slice(0, i);
          
          // Reset the current component based on remaining tags
          this.currentComponent = { text: "" };
          this.applyRemainingTags();
          break;
        }
      }
    }
    
    applyRemainingTags() {
      // Apply all tags in the stack to the current component
      for (const tag of this.tagStack) {
        switch (tag.type) {
          case 'color':
            this.currentComponent.color = tag.value;
            break;
          case 'decoration':
            switch (tag.value) {
              case 'bold': this.currentComponent.bold = true; break;
              case 'italic': this.currentComponent.italic = true; break;
              case 'underlined': this.currentComponent.underlined = true; break;
              case 'strikethrough': this.currentComponent.strikethrough = true; break;
              case 'obfuscated': this.currentComponent.obfuscated = true; break;
            }
            break;
          case 'clickEvent':
            if (this.currentComponent.clickEvent) {
              this.currentComponent.clickEvent = this.currentComponent.clickEvent;
            }
            break;
          case 'hoverEvent':
            if (this.currentComponent.hoverEvent) {
              this.currentComponent.hoverEvent = this.currentComponent.hoverEvent;
            }
            break;
          case 'insertion':
            if (this.currentComponent.insertion) {
              this.currentComponent.insertion = this.currentComponent.insertion;
            }
            break;
        }
      }
    }
    
    isColorTag(tag) {
      const colorTags = [
        'red', 'blue', 'green', 'yellow', 'gold', 'aqua', 'white', 'black',
        'gray', 'grey', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red',
        'dark_purple', 'dark_gray', 'dark_grey', 'light_purple', 'color', 'c'
      ];
      return colorTags.includes(tag) || tag.startsWith('#');
    }
    
    isDecorationTag(tag, value) {
      const decorationMap = {
        'bold': ['bold', 'b'],
        'italic': ['italic', 'i', 'em'],
        'underlined': ['underlined', 'u'],
        'strikethrough': ['strikethrough', 'st'],
        'obfuscated': ['obfuscated', 'obf']
      };
      
      return decorationMap[value]?.includes(tag) || false;
    }
    
    stripQuotes(str) {
      if ((str.startsWith("'") && str.endsWith("'")) || 
          (str.startsWith('"') && str.endsWith('"'))) {
        return str.substring(1, str.length - 1);
      }
      return str;
    }
  }
