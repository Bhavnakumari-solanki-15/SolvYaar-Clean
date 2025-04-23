import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { imgflipService } from '../../../services/imgflipService';
import { memeGeneratorService } from '../../../services/memeGeneratorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Download, Star, ThumbsUp, ThumbsDown, Eye, Trash2 } from 'lucide-react';
import { supabaseService, SavedMeme } from '../../../services/supabaseService';
import { useAuth } from '../../../hooks/useAuth';
import './MemeLab.css';

interface MemeData {
  title: string;
  template_name: string;
  top_text: string;
  bottom_text: string;
  description?: string;
}

export const MemeLab: React.FC = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [memeData, setMemeData] = useState<MemeData | null>(null);
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChaotic, setIsChaotic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null);
  const [memeTitle, setMemeTitle] = useState('');
  const [memeDescription, setMemeDescription] = useState('');
  const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
  const [showSavedMemes, setShowSavedMemes] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedMemes();
    }
  }, [user]);

  const loadSavedMemes = async () => {
    if (!user) return;
    const memes = await supabaseService.getSavedMemes(user.id);
    setSavedMemes(memes);
  };

  const handleGenerateMeme = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Generate meme data using Groq
      const data = await memeGeneratorService.generateMeme(topic, isChaotic);
      if (!data) {
        throw new Error('Failed to generate meme data');
      }
      console.log('Generated meme data:', data);
      setMemeData(data);

      // Get template ID and generate meme image
      const templateId = imgflipService.getTemplateId(data.template_name);
      console.log('Using template ID:', templateId, 'for template:', data.template_name);
      const url = await imgflipService.generateMeme(templateId, data.top_text, data.bottom_text);
      
      if (!url) {
        throw new Error('Failed to generate meme image');
      }
      console.log('Generated meme URL:', url);
      setMemeUrl(url);
      setVotes({ up: 0, down: 0 });
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate meme');
      toast.error('Failed to generate meme');
    } finally {
      setIsLoading(false);
      setIsChaotic(false);
    }
  };

  const handleInjectChaos = () => {
    setIsChaotic(true);
    handleGenerateMeme();
  };

  const handleVote = (type: 'up' | 'down') => {
    setVotes(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
    toast.success(`${type === 'up' ? '🔥' : '❄️'} Vote recorded!`);
  };

  const handleSave = () => {
    if (memeUrl) {
      const link = document.createElement('a');
      link.href = memeUrl;
      link.download = `math-meme-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Meme saved to your device!');
    }
  };

  const handleAddToHallOfFame = () => {
    toast.success('Added to Hall of Fame! 🏆');
  };

  const handleSaveMeme = async () => {
    if (!user || !memeUrl) {
      toast.error('Please generate a meme first!');
      return;
    }

    if (!memeData?.title.trim()) {
      toast.error('Please add a title for your meme!');
      return;
    }

    const memeDataToSave = {
      meme_url: memeUrl,
      title: memeData.title,
      description: memeData.description || '',
      template_name: memeData.template_name,
    };

    const savedMeme = await supabaseService.saveMeme(user.id, memeDataToSave);
    if (savedMeme) {
      toast.success('Meme saved successfully!');
      setSavedMemes([savedMeme, ...savedMemes]);
      setMemeData(null);
      setMemeUrl(null);
      setShowSavedMemes(true);
    }
  };

  const handleDeleteMeme = async (memeId: string) => {
    const success = await supabaseService.deleteSavedMeme(memeId);
    if (success) {
      toast.success('Meme deleted successfully!');
      setSavedMemes(savedMemes.filter(meme => meme.id !== memeId));
    }
  };

  const handleViewSavedMeme = (meme: SavedMeme) => {
    setMemeData({
      title: meme.title,
      template_name: meme.template_name || '',
      top_text: '',
      bottom_text: '',
      description: meme.description || ''
    });
    setMemeUrl(meme.meme_url);
    setShowSavedMemes(false);
  };

  const handleDownloadSavedMeme = (memeUrl: string, title: string) => {
    const link = document.createElement('a');
    link.href = memeUrl;
    link.download = `math-meme-${title}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Meme downloaded!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="meme-lab-container">
      <motion.div 
        className="meme-lab-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>Meme Lab</h2>
        <p>Where Math Meets Memes</p>
        <div className="header-sparkles">
          <Sparkles className="sparkle-icon" />
        </div>
        <button 
          className="toggle-view-button"
          onClick={() => setShowSavedMemes(!showSavedMemes)}
        >
          {showSavedMemes ? 'Create Meme' : 'View Saved Memes'}
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showSavedMemes ? (
          <motion.div
            key="creator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="meme-creator-section"
          >
            <motion.div 
              className="meme-input-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a math topic (e.g., calculus, algebra)"
                className="meme-input"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && topic.trim()) {
                    handleGenerateMeme();
                  }
                }}
              />
              <div className="meme-buttons">
                <Button
                  onClick={handleGenerateMeme}
                  disabled={isLoading || !topic.trim()}
                  className="generate-button"
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">✨</span>
                      Generate Meme
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleInjectChaos}
                  disabled={isLoading || !topic.trim()}
                  className="chaos-button"
                  variant="default"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isLoading ? 'Unleashing Chaos...' : 'Inject Chaos'}
                </Button>
              </div>
            </motion.div>

            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {error}
              </motion.div>
            )}

            {memeData && memeUrl && (
              <motion.div
                className="meme-result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="meme-info">
                  <h3>{memeData.title}</h3>
                  {memeData.description && <p>{memeData.description}</p>}
                </div>
                
                <div className="meme-display">
                  <img 
                    src={memeUrl} 
                    alt={memeData.title} 
                    className="meme-image"
                    onError={() => {
                      setError('Failed to load meme image');
                      setMemeUrl(null);
                    }}
                  />
                </div>

                <div className="meme-stats">
                  <div className="vote-count">
                    <span>🔥 {votes.up}</span>
                    <span>❄️ {votes.down}</span>
                  </div>
                </div>

                <div className="meme-actions">
                  <Button 
                    variant="outline" 
                    className="action-button vote-hot"
                    onClick={() => handleVote('up')}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Hot
                  </Button>
                  <Button 
                    variant="outline" 
                    className="action-button vote-cold"
                    onClick={() => handleVote('down')}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Cold
                  </Button>
                  <Button 
                    variant="outline" 
                    className="action-button"
                    onClick={handleSave}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    className="action-button save-meme-button"
                    onClick={handleSaveMeme}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Save to Collection
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="saved-memes-section"
          >
            <h3>Your Saved Memes</h3>
            <div className="saved-memes-grid">
              {savedMemes.map((meme) => (
                <motion.div
                  key={meme.id}
                  className="saved-meme-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleViewSavedMeme(meme)}
                >
                  <img src={meme.meme_url} alt={meme.title} />
                  <div className="saved-meme-info">
                    <h4>{meme.title}</h4>
                    {meme.description && <p>{meme.description}</p>}
                    <p className="meme-timestamp">Created: {formatDate(meme.created_at)}</p>
                    <button
                      className="delete-meme-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMeme(meme.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemeLab; 