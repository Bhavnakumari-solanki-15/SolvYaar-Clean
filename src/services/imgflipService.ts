import { toast } from "../components/ui/sonner";

interface ImgflipMeme {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

interface ImgflipResponse {
  success: boolean;
  data: {
    memes: ImgflipMeme[];
  };
}

interface CaptionResponse {
  success: boolean;
  data: {
    url: string;
    page_url: string;
  };
  error_message?: string;
}

class ImgflipService {
  private username: string;
  private password: string;
  private baseUrl = 'https://api.imgflip.com';
  private popularTemplates: { [key: string]: string } = {
    'Drake Hotline Bling': '181913649',
    'Distracted Boyfriend': '112126428',
    'Two Buttons': '87743020',
    'Change My Mind': '129242436',
    'Expanding Brain': '93895088',
    'Buff Doge vs. Cheems': '247375501',
    'Woman Yelling At Cat': '188390779',
    'Gru\'s Plan': '131940431',
    'One Does Not Simply': '61579',
    'Epic Handshake': '135256802',
    'Running Away Balloon': '131087935',
    'Left Exit 12 Off Ramp': '124822590',
    'Tuxedo Winnie The Pooh': '178591752',
    'Brain On Fire': '1232104',
    'Surprised Pikachu': '155067746',
    'Panik Kalm Panik': '226297822',
    'They\'re The Same Picture': '180190441',
    'Math Lady': '102156234',
    'X, X Everywhere': '91538330',
    'Y U No': '61527'
  };

  constructor() {
    this.username = import.meta.env.VITE_IMGFLIP_USERNAME || '';
    this.password = import.meta.env.VITE_IMGFLIP_PASSWORD || '';
    
    // Log credentials (without password) to verify they're loaded
    console.log('Imgflip username loaded:', !!this.username);
  }

  async getMemeTemplates(): Promise<ImgflipMeme[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get_memes`);
      const data: ImgflipResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch meme templates');
      }
      
      return data.data.memes;
    } catch (error) {
      console.error('Error fetching meme templates:', error);
      toast.error('Failed to fetch meme templates');
      return [];
    }
  }

  async generateMeme(templateId: string, topText: string, bottomText: string): Promise<string | null> {
    try {
      console.log('Generating meme with:', {
        templateId,
        topText,
        bottomText,
        hasUsername: !!this.username,
        hasPassword: !!this.password
      });

      const formData = new URLSearchParams();
      formData.append('template_id', templateId);
      formData.append('username', this.username);
      formData.append('password', this.password);
      formData.append('text0', topText);
      formData.append('text1', bottomText);

      const response = await fetch(`${this.baseUrl}/caption_image`, {
        method: 'POST',
        body: formData
      });

      const data: CaptionResponse = await response.json();
      console.log('Imgflip API response:', data);
      
      if (!data.success) {
        throw new Error(data.error_message || 'Failed to generate meme');
      }
      
      return data.data.url;
    } catch (error) {
      console.error('Error generating meme:', error);
      if (error instanceof Error) {
        toast.error(`Failed to generate meme: ${error.message}`);
      } else {
        toast.error('Failed to generate meme');
      }
      return null;
    }
  }

  getTemplateId(templateName: string): string {
    // First check popular templates
    const templateId = this.popularTemplates[templateName];
    console.log('Template lookup:', { templateName, templateId });
    
    // If not found in popular templates, use Drake as fallback
    if (!templateId) {
      console.log('Template not found, using Drake fallback');
      return this.popularTemplates['Drake Hotline Bling'];
    }
    
    return templateId;
  }
}

export const imgflipService = new ImgflipService(); 