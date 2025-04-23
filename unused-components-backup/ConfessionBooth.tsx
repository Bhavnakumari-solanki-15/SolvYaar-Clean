import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Groq } from 'groq-sdk';
import './ConfessionBooth.css';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Confession {
  id: string;
  content: string;
  timestamp: Date;
  response: string;
  isRedeemed: boolean;
}

const ConfessionBooth: React.FC = () => {
  const [confession, setConfession] = useState('');
  const [currentConfession, setCurrentConfession] = useState<Confession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sinCounter, setSinCounter] = useState(0);
  const [showRedemption, setShowRedemption] = useState(false);
  const [redemptionChallenge, setRedemptionChallenge] = useState<string>('');
  const [redemptionAnswer, setRedemptionAnswer] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleConfess = async () => {
    if (!confession.trim()) return;

    setIsLoading(true);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a sarcastic math priest. Respond to this math confession with a mix of mock forgiveness, deep roasts, and math-related punishments. Be dramatic and over-the-top. End with a redemption challenge (a simple math problem). The response should be in this format:
            {
              "response": "Your dramatic response to the confession",
              "redemptionChallenge": "A simple math problem for redemption"
            }`
          },
          {
            role: "user",
            content: confession
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        max_tokens: 200
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (aiResponse) {
        try {
          const parsedResponse = JSON.parse(aiResponse);
          const newConfession: Confession = {
            id: Date.now().toString(),
            content: confession,
            timestamp: new Date(),
            response: parsedResponse.response,
            isRedeemed: false
          };
          setCurrentConfession(newConfession);
          setRedemptionChallenge(parsedResponse.redemptionChallenge);
          setSinCounter(prev => prev + 1);
          setShowRedemption(true);
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    } catch (error) {
      console.error('Error processing confession:', error);
    } finally {
      setIsLoading(false);
      setConfession('');
    }
  };

  const handleRedemption = async () => {
    if (!redemptionAnswer.trim() || !currentConfession) return;

    setIsRedeeming(true);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Verify if this answer is correct for the math problem: ${redemptionChallenge}. The response should be in this format:
            {
              "isCorrect": boolean,
              "explanation": "Explanation of why the answer is correct or incorrect"
            }`
          },
          {
            role: "user",
            content: redemptionAnswer
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 100
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (aiResponse) {
        try {
          const parsedResponse = JSON.parse(aiResponse);
          if (parsedResponse.isCorrect) {
            setCurrentConfession(prev => prev ? { ...prev, isRedeemed: true } : null);
            setSinCounter(prev => Math.max(0, prev - 1));
            setShowRedemption(false);
          }
          // Show the explanation to the user
          alert(parsedResponse.explanation);
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    } catch (error) {
      console.error('Error verifying redemption:', error);
    } finally {
      setIsRedeeming(false);
      setRedemptionAnswer('');
    }
  };

  return (
    <div className="confession-booth-container">
      <div className="confession-header">
        <h2>Forgive My Algebra Sins</h2>
        <div className="sin-counter">
          <span>Total Sins: {sinCounter}</span>
        </div>
      </div>

      <div className="confession-box">
        <textarea
          value={confession}
          onChange={(e) => setConfession(e.target.value)}
          placeholder="Confess your math sins here... (e.g., 'I used ChatGPT for my homework')"
          disabled={isLoading}
        />
        <motion.button
          className="confess-button"
          onClick={handleConfess}
          disabled={isLoading || !confession.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? 'Processing...' : 'Confess'}
        </motion.button>
      </div>

      {currentConfession && (
        <div className="confession-response">
          <div className="confession-content">
            <p className="confession-text">{currentConfession.content}</p>
            <p className="confession-time">
              {currentConfession.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <div className="priest-response">
            <p>{currentConfession.response}</p>
          </div>
        </div>
      )}

      {showRedemption && currentConfession && !currentConfession.isRedeemed && (
        <div className="redemption-challenge">
          <h3>Redemption Challenge</h3>
          <p>{redemptionChallenge}</p>
          <div className="redemption-input">
            <input
              type="text"
              value={redemptionAnswer}
              onChange={(e) => setRedemptionAnswer(e.target.value)}
              placeholder="Enter your answer..."
              disabled={isRedeeming}
            />
            <button
              onClick={handleRedemption}
              disabled={isRedeeming || !redemptionAnswer.trim()}
            >
              {isRedeeming ? 'Verifying...' : 'Redeem'}
            </button>
          </div>
        </div>
      )}

      {currentConfession?.isRedeemed && (
        <div className="redemption-success">
          <h3>🎉 Redemption Complete! 🎉</h3>
          <p>Your sins have been forgiven... for now.</p>
        </div>
      )}
    </div>
  );
};

export default ConfessionBooth; 