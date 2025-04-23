import React from 'react';
import { FaLock, FaScroll, FaSpinner } from 'react-icons/fa';
import './MathOracle.css';

interface MathOracleProps {
  isGenerating: boolean;
  fortuneText: string | null;
  fortuneImageUrl: string | null;
  scrolls: Array<{
    id: string;
    problem: string;
    image_url: string;
  }>;
  onGenerateFortune: () => void;
}

export const MathOracle: React.FC<MathOracleProps> = ({
  isGenerating,
  fortuneText,
  fortuneImageUrl,
  scrolls,
  onGenerateFortune,
}) => {
  return (
    <div className="math-oracle-container">
      <div className="section-overlay" />
      <div className="section-content">
        {/* Title Section */}
        <section className="oracle-title-section">
          <h1 className="oracle-title">
            Math Oracle
            <span className="sparkle">✨</span>
          </h1>
          <p className="oracle-description">
            Unveil the mystical wisdom of mathematics through the ancient art of divination.
            Let the Math Oracle guide you through the ethereal realm of numbers and equations.
          </p>
        </section>

        {/* Fortune Section */}
        <section className="fortune-section">
          <button
            className="reveal-button"
            onClick={onGenerateFortune}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="loading-text">
                <FaSpinner className="animate-spin" />
                Consulting the Oracle...
              </span>
            ) : (
              'Reveal Your Fortune'
            )}
          </button>

          {fortuneText && (
            <div className="fortune-card">
              <p className="fortune-content">{fortuneText}</p>
              {fortuneImageUrl && (
                <img
                  src={fortuneImageUrl}
                  alt="Fortune visualization"
                  className="fortune-image"
                />
              )}
            </div>
          )}
        </section>

        {/* Scrolls Section */}
        <section className="scrolls-section">
          <h2 className="scrolls-title">Your Scroll Collection</h2>
          {scrolls.length === 0 ? (
            <div className="no-scrolls">
              <FaLock className="lock-icon" />
              <p>No scrolls collected yet. Complete math challenges to earn mystical scrolls!</p>
            </div>
          ) : (
            <div className="scrolls-grid">
              {scrolls.map((scroll) => (
                <div key={scroll.id} className="scroll-card">
                  <div className="scroll-content">
                    <FaScroll className="scroll-icon" />
                    <p className="scroll-text">{scroll.problem}</p>
                    <img
                      src={scroll.image_url}
                      alt={`Scroll ${scroll.id}`}
                      className="scroll-image"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}; 