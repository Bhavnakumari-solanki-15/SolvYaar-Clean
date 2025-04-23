/**
 * Image fetching utilities for math oracle
 */

// The following keys would need to be provided by the user or stored in environment variables
let UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
let IMGFLIP_USERNAME = import.meta.env.VITE_IMGFLIP_USERNAME || '';
let IMGFLIP_PASSWORD = import.meta.env.VITE_IMGFLIP_PASSWORD || '';

/**
 * Set the Unsplash API access key
 */
export function setUnsplashAccessKey(key: string): void {
  if (!key) {
    console.warn('Warning: Empty Unsplash access key provided');
    return;
  }
  UNSPLASH_ACCESS_KEY = key;
}

/**
 * Set the ImgFlip credentials
 */
export function setImgFlipCredentials(username: string, password: string): void {
  if (!username || !password) {
    console.warn('Warning: Empty ImgFlip credentials provided');
    return;
  }
  IMGFLIP_USERNAME = username;
  IMGFLIP_PASSWORD = password;
}

/**
 * Random image source choice
 */
type ImageSource = 'unsplash' | 'meme';

/**
 * Get a random image source
 */
function getRandomImageSource(): ImageSource {
  return Math.random() > 0.7 ? 'meme' : 'unsplash'; // Prefer Unsplash for better quality
}

// Math topic to specific image search terms mapping for better relevance
const MATH_TOPIC_IMAGES: Record<string, string[]> = {
  // Calculus related
  'calculus': ['mathematics calculus', 'calculus equation', 'calculus visualization', 'derivative graph'],
  'derivative': ['derivative graph', 'calculus slope', 'rate of change'],
  'integral': ['integral area', 'calculus area', 'integration mathematics'],
  
  // Geometry related
  'geometry': ['geometric shapes', 'sacred geometry', 'mathematics geometry', 'geometric pattern'],
  'shape': ['geometric shapes', 'mathematics geometry', 'platonic solids'],
  'triangle': ['geometric triangle', 'mathematics triangle', 'triangle theorem'],
  'circle': ['mathematical circle', 'perfect circle geometry', 'circle theorems'],
  
  // Algebra related
  'algebra': ['algebra equation', 'mathematics formula', 'algebraic expression'],
  'equation': ['mathematical equation', 'algebraic formula', 'math symbols'],
  'linear': ['linear equations', 'linear algebra', 'matrix mathematics'],
  
  // Probability & Statistics
  'probability': ['probability dice', 'statistics chart', 'probability distribution', 'random events'],
  'statistics': ['data visualization', 'statistical graph', 'data science', 'probability chart'],
  'random': ['random distribution', 'probability', 'random events mathematics'],
  
  // Number theory
  'number': ['number theory', 'prime numbers', 'mathematical numbers', 'number pattern'],
  'prime': ['prime numbers', 'number theory', 'prime factorization', 'mathematical prime'],
  'fibonacci': ['fibonacci spiral', 'golden ratio', 'fibonacci sequence', 'mathematics pattern'],
  
  // Topology
  'topology': ['topology mathematics', 'topological surface', 'möbius strip', 'klein bottle'],
  'surface': ['mathematical surface', 'topology', 'geometric surface', '3d mathematics'],
  
  // Graph theory
  'graph': ['graph theory', 'mathematical graph', 'network diagram', 'connected graph'],
  'network': ['network mathematics', 'graph theory', 'mathematical network', 'connected graph'],
  
  // Logic and sets
  'logic': ['mathematical logic', 'logical diagram', 'venn diagram', 'boolean logic'],
  'set': ['set theory mathematics', 'venn diagram', 'mathematical sets', 'intersection union'],
  
  // Fractals
  'fractal': ['fractal mathematics', 'mandelbrot set', 'fractal pattern', 'recursive pattern'],
  'chaos': ['chaos theory', 'fractal pattern', 'butterfly effect', 'chaotic system'],
  
  // General mathematical concepts
  'infinity': ['infinity symbol', 'mathematical infinity', 'endless mathematics', 'infinite series'],
  'pattern': ['mathematical pattern', 'number sequence', 'geometric pattern', 'mathematical symmetry'],
  'symmetry': ['mathematical symmetry', 'geometric symmetry', 'symmetrical pattern', 'bilateral symmetry'],
  'dimension': ['mathematical dimensions', 'geometry dimensions', 'hypercube', 'tesseract'],
  
  // Fallback
  'math': ['mathematics', 'mathematical formula', 'math education', 'geometric pattern']
};

/**
 * Find the best matching topic for the achievement from title and keywords
 */
function findMatchingMathTopic(title: string, keywords: string[]): string[] {
  // Convert to lowercase for matching
  const titleLower = title.toLowerCase();
  
  // Combine the title and keywords for a more comprehensive search
  const searchTerms = [...keywords, ...titleLower.split(/\s+/)];
  
  // Look for direct matches in our topic mapping
  for (const term of searchTerms) {
    if (MATH_TOPIC_IMAGES[term]) {
      return MATH_TOPIC_IMAGES[term];
    }
  }
  
  // Check for partial matches (e.g., if title contains "calculus master")
  for (const topic of Object.keys(MATH_TOPIC_IMAGES)) {
    if (titleLower.includes(topic)) {
      return MATH_TOPIC_IMAGES[topic];
    }
  }
  
  // If no specific match is found, combine the first keyword with "math"
  if (keywords.length > 0) {
    return [`mathematics ${keywords[0]}`, 'mathematical concept', 'mathematics education'];
  }
  
  // Default fallback
  return MATH_TOPIC_IMAGES['math'];
}

/**
 * Fetch an image based on keywords and title
 */
export async function fetchImageForFortune(
  fortune: string, 
  keywords: string[],
  title?: string,
  preferredSource?: ImageSource
): Promise<{ url: string; source: ImageSource }> {
  const source = preferredSource || getRandomImageSource();
  
  // Get the most relevant search terms based on the math topic
  const relevantSearchTerms = title 
    ? findMatchingMathTopic(title, keywords)
    : keywords;
  
  try {
    if (source === 'unsplash') {
      return await fetchUnsplashImage(relevantSearchTerms);
    } else {
      return await createMemeImage(fortune, keywords);
    }
  } catch (error) {
    console.error(`Error fetching ${source} image:`, error);
    
    // If one source fails, try the other
    const fallbackSource: ImageSource = source === 'unsplash' ? 'meme' : 'unsplash';
    try {
      if (fallbackSource === 'unsplash') {
        return await fetchUnsplashImage(relevantSearchTerms);
      } else {
        return await createMemeImage(fortune, keywords);
      }
    } catch (fallbackError) {
      console.error(`Error fetching fallback ${fallbackSource} image:`, fallbackError);
      throw new Error('Failed to fetch image from both sources');
    }
  }
}

/**
 * Fetch an image from Unsplash based on keywords
 */
async function fetchUnsplashImage(keywords: string[]): Promise<{ url: string; source: 'unsplash' }> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('Unsplash API key is not set. Please call setUnsplashAccessKey() first.');
  }

  // Use a random keyword from our list for variety
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  const query = randomKeyword;
  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { 
      url: data.urls.regular, 
      source: 'unsplash' 
    };
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    throw error;
  }
}

// Popular meme templates that work well with math content
const MATH_MEME_TEMPLATES = [
  { id: '61579', name: 'One Does Not Simply' },
  { id: '101470', name: 'Ancient Aliens' },
  { id: '61532', name: 'The Most Interesting Man In The World' },
  { id: '61520', name: 'Futurama Fry' },
  { id: '563423', name: 'That Would Be Great' },
  { id: '4087833', name: 'Waiting Skeleton' },
  { id: '21735', name: 'The Rock Driving' },
  { id: '100947', name: 'Matrix Morpheus' },
  { id: '87743020', name: 'Two Buttons' },
  { id: '438680', name: 'Batman Slapping Robin' },
];

/**
 * Create a meme image with ImgFlip API
 */
async function createMemeImage(fortune: string, keywords: string[]): Promise<{ url: string; source: 'meme' }> {
  if (!IMGFLIP_USERNAME || !IMGFLIP_PASSWORD) {
    throw new Error('ImgFlip credentials are not set. Please call setImgFlipCredentials() first.');
  }

  // Split the fortune into two parts for the meme
  const fortuneParts = splitFortuneForMeme(fortune);
  
  // Select a random meme template
  const template = MATH_MEME_TEMPLATES[Math.floor(Math.random() * MATH_MEME_TEMPLATES.length)];
  
  const formData = new FormData();
  formData.append('template_id', template.id);
  formData.append('username', IMGFLIP_USERNAME);
  formData.append('password', IMGFLIP_PASSWORD);
  formData.append('text0', fortuneParts.top);
  formData.append('text1', fortuneParts.bottom);
  
  try {
    const response = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`ImgFlip API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`ImgFlip API error: ${result.error_message}`);
    }
    
    return { 
      url: result.data.url, 
      source: 'meme' 
    };
  } catch (error) {
    console.error('Error creating meme image:', error);
    throw error;
  }
}

/**
 * Split a fortune into top and bottom text for a meme
 */
function splitFortuneForMeme(fortune: string): { top: string; bottom: string } {
  const sentences = fortune.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 1) {
    // If only one sentence, split it approximately in half by words
    const words = sentences[0].trim().split(/\s+/);
    const midpoint = Math.ceil(words.length / 2);
    
    return {
      top: words.slice(0, midpoint).join(' '),
      bottom: words.slice(midpoint).join(' ')
    };
  } else {
    // Use the first sentence as top text and the rest as bottom text
    return {
      top: sentences[0].trim(),
      bottom: sentences.slice(1).join('. ').trim()
    };
  }
} 