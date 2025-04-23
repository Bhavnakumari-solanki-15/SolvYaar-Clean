import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, IconButton, Tooltip } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ShareIcon from '@mui/icons-material/Share';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { MathScroll } from '../lib/supabase';

interface MathScrollCardProps {
  scroll: MathScroll;
}

export const MathScrollCard: React.FC<MathScrollCardProps> = ({ scroll }) => {
  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Check out my Math Scroll!',
        text: `I solved this mathematical challenge:\n\n${scroll.problem}\n\nSolution:\n${scroll.solution}`,
        url: `https://yourapp.com/scroll/${scroll.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Card 
      sx={{ 
        minWidth: 275, 
        maxWidth: 345,
        background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
        color: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 20px rgba(0,0,0,0.3)',
        }
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={scroll.image_url}
        alt="Math Scroll Background"
        sx={{
          objectFit: 'cover',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoStoriesIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ fontFamily: "'Cinzel', serif" }}>
              📜 Scroll #{scroll.id.slice(0, 4)}
            </Typography>
          </Box>
          <Tooltip title="Share this scroll">
            <IconButton onClick={handleShare} size="small" sx={{ color: 'white' }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2,
            color: '#e3f2fd',
            fontFamily: "'Merriweather', serif",
            fontSize: '0.9rem',
            maxHeight: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          <ReactMarkdown>{scroll.problem}</ReactMarkdown>
        </Typography>

        <Box 
          sx={{ 
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            p: 1.5,
            mb: 2,
            maxHeight: '80px',
            overflow: 'hidden'
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#b3e5fc',
              fontFamily: "'Source Code Pro', monospace",
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            <ReactMarkdown>{scroll.solution}</ReactMarkdown>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#90caf9',
              fontStyle: 'italic'
            }}
          >
            🕒 {format(new Date(scroll.timestamp), 'MMM d, yyyy')}
          </Typography>
          <Tooltip title="View on Monad Explorer">
            <Typography
              variant="caption"
              component="a"
              href={`https://testnet.monadexplorer.com/tx/${scroll.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#90caf9',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              View Transaction ↗
            </Typography>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}; 