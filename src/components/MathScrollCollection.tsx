import React from 'react';
import { Container, Typography, Grid, Box, Alert, Link, CircularProgress } from '@mui/material';
import { MathScrollCard } from './MathScrollCard';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import { MathScroll } from '../lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface MathScrollCollectionProps {
  scrolls: MathScroll[];
  isLoading?: boolean;
}

export const MathScrollCollection: React.FC<MathScrollCollectionProps> = ({ scrolls, isLoading }) => {
  return (
    <Container maxWidth="lg">
      <Alert 
        severity="info" 
        sx={{ 
          mb: 4,
          mt: 2,
          borderRadius: '8px',
          '& a': {
            color: 'inherit',
            fontWeight: 'bold',
            textDecoration: 'underline'
          }
        }}
      >
        🪙 Don't have Monad test tokens? <Link href="https://faucet.testnet.monad.xyz/" target="_blank" rel="noopener noreferrer">Click here</Link> to get free tokens for minting.
      </Alert>

      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 6, 
          mt: 4,
          background: 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)',
          borderRadius: '16px',
          padding: '2rem',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <AutoStoriesIcon sx={{ fontSize: 40, mr: 2 }} />
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontFamily: "'Cinzel', serif",
              background: 'linear-gradient(45deg, #e3f2fd 30%, #90caf9 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Arcane Library
          </Typography>
        </Box>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: '#b3e5fc',
            fontFamily: "'Merriweather', serif",
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          Your mystical collection of mathematical wisdom, each scroll a testament to conquered challenges
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : scrolls.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            my: 4, 
            p: 4, 
            borderRadius: '8px', 
            background: 'rgba(255,255,255,0.05)',
            color: '#90caf9'
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your library awaits its first scroll...
          </Typography>
          <Typography variant="body2">
            Solve a mathematical challenge to mint your first scroll!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {scrolls.map((scroll) => (
            <Grid item xs={12} sm={6} md={4} key={scroll.id}>
              <MathScrollCard scroll={scroll} />
            </Grid>
          ))}
        </Grid>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </Container>
  );
}; 