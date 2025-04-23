import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Groq } from 'groq-sdk';
import './HotTakes.css';

interface HotTake {
  id: string;
  title: string;
  content: string;
  category: 'controversial' | 'unpopular' | 'revolutionary';
  votes: {
    agree: number;
    disagree: number;
  };
  timestamp: string;
}

const HotTakes = () => {
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'controversial' | 'unpopular' | 'revolutionary'>('controversial');
  const [newTakeTitle, setNewTakeTitle] = useState('');
  const [newTakeContent, setNewTakeContent] = useState('');

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY as string,
    dangerouslyAllowBrowser: true
  });

  const generateHotTake = async () => {
    if (!newTakeTitle.trim() || !newTakeContent.trim()) return;
    
    setLoading(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a math debate expert. Generate a controversial math opinion based on the user's input."
          },
          {
            role: "user",
            content: `Title: ${newTakeTitle}\nContent: ${newTakeContent}\nGenerate a controversial math take in this format: { "title": "string", "content": "string", "category": "controversial" | "unpopular" | "revolutionary" }`
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 500
      });

      const generatedTake = JSON.parse(response.choices[0].message.content);
      
      const newTake: HotTake = {
        id: Date.now().toString(),
        ...generatedTake,
        votes: {
          agree: 0,
          disagree: 0
        },
        timestamp: new Date().toISOString()
      };

      setHotTakes(prev => [newTake, ...prev]);
      setNewTakeTitle('');
      setNewTakeContent('');
    } catch (error) {
      console.error('Error generating hot take:', error);
    } finally {
      setLoading(false);
    }
  };

  const voteOnTake = (id: string, vote: 'agree' | 'disagree') => {
    setHotTakes(prev => prev.map(take => {
      if (take.id === id) {
        return {
          ...take,
          votes: {
            ...take.votes,
            [vote]: take.votes[vote] + 1
          }
        };
      }
      return take;
    }));
  };

  const filteredTakes = hotTakes.filter(take => take.category === selectedCategory);

  return (
    <div className="hot-takes-container">
      <div className="hot-takes-header">
        <h2>Math Hot Takes</h2>
        <p>Share your most controversial math opinions and see what others think!</p>
      </div>

      <div className="take-categories">
        <button
          className={`category-button ${selectedCategory === 'controversial' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('controversial')}
        >
          Controversial
        </button>
        <button
          className={`category-button ${selectedCategory === 'unpopular' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('unpopular')}
        >
          Unpopular
        </button>
        <button
          className={`category-button ${selectedCategory === 'revolutionary' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('revolutionary')}
        >
          Revolutionary
        </button>
      </div>

      <div className="new-take-form">
        <input
          type="text"
          className="take-input"
          placeholder="Your hot take title..."
          value={newTakeTitle}
          onChange={(e) => setNewTakeTitle(e.target.value)}
        />
        <textarea
          className="take-textarea"
          placeholder="Explain your controversial math opinion..."
          value={newTakeContent}
          onChange={(e) => setNewTakeContent(e.target.value)}
        />
        <button
          className="generate-button"
          onClick={generateHotTake}
          disabled={loading || !newTakeTitle.trim() || !newTakeContent.trim()}
        >
          {loading ? 'Generating...' : 'Share Hot Take'}
        </button>
      </div>

      <div className="hot-takes-list">
        {filteredTakes.map((take) => (
          <motion.div
            key={take.id}
            className="take-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="take-header">
              <h3>{take.title}</h3>
              <span className={`take-category ${take.category}`}>
                {take.category}
              </span>
            </div>
            <div className="take-content">
              {take.content}
            </div>
            <div className="take-footer">
              <div className="take-votes">
                <button
                  className="vote-button agree"
                  onClick={() => voteOnTake(take.id, 'agree')}
                >
                  Agree ({take.votes.agree})
                </button>
                <button
                  className="vote-button disagree"
                  onClick={() => voteOnTake(take.id, 'disagree')}
                >
                  Disagree ({take.votes.disagree})
                </button>
              </div>
              <div className="take-time">
                {new Date(take.timestamp).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HotTakes; 