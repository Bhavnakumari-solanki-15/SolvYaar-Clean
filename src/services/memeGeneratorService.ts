import { groqService } from './groqService';

interface MemeData {
  title: string;
  template_name: string;
  top_text: string;
  bottom_text: string;
}

class MemeGeneratorService {
  private templateSuggestions = {
    'algebra': ['Drake Hotline Bling', 'Expanding Brain', 'Math Lady', 'Y U No', 'Gru\'s Plan'],
    'calculus': ['Brain On Fire', 'Surprised Pikachu', 'One Does Not Simply', 'Panik Kalm Panik', 'Math Lady'],
    'geometry': ['Change My Mind', 'Two Buttons', 'Epic Handshake', 'X, X Everywhere', 'Tuxedo Winnie The Pooh'],
    'default': ['Drake Hotline Bling', 'Expanding Brain', 'Math Lady', 'Surprised Pikachu', 'Panik Kalm Panik']
  };

  constructor() {}

  private getTemplatesForTopic(topic: string): string[] {
    const normalizedTopic = topic.toLowerCase();
    for (const [key, templates] of Object.entries(this.templateSuggestions)) {
      if (normalizedTopic.includes(key)) {
        return templates;
      }
    }
    return this.templateSuggestions.default;
  }

  async generateMeme(topic: string, isChaotic: boolean = false): Promise<MemeData | null> {
    try {
      console.log('Generating meme for topic:', topic, 'isChaotic:', isChaotic);
      
      const suggestedTemplates = this.getTemplatesForTopic(topic);
      const templateList = suggestedTemplates.join('", "');
      
      const prompt = `Generate a math meme about ${topic}. ${
        isChaotic ? 'Make it extra chaotic and absurd!' : ''
      }
      IMPORTANT: Choose a template from this list and DO NOT use others: "${templateList}".
      Each template is good for different scenarios:
      - Drake: Comparing two mathematical concepts
      - Expanding Brain: Showing progression of complexity
      - Math Lady: Confusion or complex calculations
      - Surprised Pikachu: Unexpected math results
      - Panik Kalm Panik: Problem-solving stages
      - Y U No: Math frustrations
      - Gru's Plan: When solutions go wrong
      - One Does Not Simply: Difficult math concepts
      
      Return ONLY a JSON object with the following structure:
      {
        "title": "Brief, catchy title",
        "template_name": "MUST be one from the list above",
        "top_text": "Top text of the meme",
        "bottom_text": "Bottom text of the meme"
      }`;

      const response = await groqService.generateResponse(prompt);
      console.log('Raw Groq response:', response);
      
      try {
        // Extract JSON from the response by finding the first { and last }
        const jsonStart = response.indexOf('{');
        const jsonEnd = response.lastIndexOf('}') + 1;
        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON object found in response');
        }
        
        const jsonStr = response.slice(jsonStart, jsonEnd);
        const memeData = JSON.parse(jsonStr);
        console.log('Parsed meme data:', memeData);
        
        // Validate the response structure
        if (!this.isValidMemeData(memeData)) {
          throw new Error('Invalid meme data structure');
        }
        
        return memeData;
      } catch (parseError) {
        console.error('Failed to parse meme data:', parseError);
        throw new Error('Failed to parse meme data from AI response');
      }
    } catch (error) {
      console.error('Error in meme generation:', error);
      return null;
    }
  }

  private isValidMemeData(data: any): data is MemeData {
    return (
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      typeof data.template_name === 'string' &&
      typeof data.top_text === 'string' &&
      typeof data.bottom_text === 'string'
    );
  }
}

export const memeGeneratorService = new MemeGeneratorService(); 