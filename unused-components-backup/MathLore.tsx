import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Groq } from 'groq-sdk';
import './MathLore.css';

interface LoreEntry {
  id: string;
  title: string;
  content: string;
  category: 'history' | 'mythology' | 'urban-legend';
  votes: {
    like: number;
    dislike: number;
  };
  timestamp: string;
}

const MathLore = () => {
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'history' | 'mythology' | 'urban-legend'>('history');
  const [newLoreTitle, setNewLoreTitle] = useState('');
  const [newLoreContent, setNewLoreContent] = useState('');

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY as string,
    dangerouslyAllowBrowser: true
  });

  const generateLore = async () => {
    if (!newLoreTitle.trim() || !newLoreContent.trim()) return;
    
    setLoading(true);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a math historian and storyteller. Generate an interesting math lore entry based on the user's input."
          },
          {
            role: "user",
            content: `Title: ${newLoreTitle}\nContent: ${newLoreContent}\nGenerate a math lore entry in this format: { "title": "string", "content": "string", "category": "history" | "mythology" | "urban-legend" }`
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No content received from AI');
      
      const generatedLore = JSON.parse(content);
      
      const newLore: LoreEntry = {
        id: Date.now().toString(),
        ...generatedLore,
        votes: {
          like: 0,
          dislike: 0
        },
        timestamp: new Date().toISOString()
      };

      setLoreEntries(prev => [newLore, ...prev]);
      setNewLoreTitle('');
      setNewLoreContent('');
    } catch (error) {
      console.error('Error generating lore:', error);
    } finally {
      setLoading(false);
    }
  };

  const voteOnLore = (id: string, vote: 'like' | 'dislike') => {
    setLoreEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          votes: {
            ...entry.votes,
            [vote]: entry.votes[vote] + 1
          }
        };
      }
      return entry;
    }));
  };

  const filteredEntries = loreEntries.filter(entry => entry.category === selectedCategory);

  return (
    <div className="math-lore-container">
      <div className="math-lore-header">
        <h2>Math Lore</h2>
        <p>Discover and share fascinating stories from the world of mathematics!</p>
      </div>

      <div className="lore-categories">
        <button
          className={`category-button ${selectedCategory === 'history' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('history')}
        >
          History
        </button>
        <button
          className={`category-button ${selectedCategory === 'mythology' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('mythology')}
        >
          Mythology
        </button>
        <button
          className={`category-button ${selectedCategory === 'urban-legend' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('urban-legend')}
        >
          Urban Legend
        </button>
      </div>

      <div className="new-lore-form">
        <input
          type="text"
          className="lore-input"
          placeholder="Your lore title..."
          value={newLoreTitle}
          onChange={(e) => setNewLoreTitle(e.target.value)}
        />
        <textarea
          className="lore-textarea"
          placeholder="Tell your math story..."
          value={newLoreContent}
          onChange={(e) => setNewLoreContent(e.target.value)}
        />
        <button
          className="generate-button"
          onClick={generateLore}
          disabled={loading || !newLoreTitle.trim() || !newLoreContent.trim()}
        >
          {loading ? 'Generating...' : 'Share Lore'}
        </button>
      </div>

      <div className="lore-entries">
        {filteredEntries.map((entry) => (
          <motion.div
            key={entry.id}
            className="lore-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="lore-header">
              <h3>{entry.title}</h3>
              <span className={`lore-category ${entry.category}`}>
                {entry.category}
              </span>
            </div>
            <div className="lore-content">
              {entry.content}
            </div>
            <div className="lore-footer">
              <div className="lore-actions">
                <button
                  className="vote-button like"
                  onClick={() => voteOnLore(entry.id, 'like')}
                >
                  Like ({entry.votes.like})
                </button>
                <button
                  className="vote-button dislike"
                  onClick={() => voteOnLore(entry.id, 'dislike')}
                >
                  Dislike ({entry.votes.dislike})
                </button>
              </div>
              <div className="lore-time">
                {new Date(entry.timestamp).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MathLore; 