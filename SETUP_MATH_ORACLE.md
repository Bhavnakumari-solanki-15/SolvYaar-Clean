# Math Oracle Setup Guide

This guide provides step-by-step instructions to deploy and set up the Math Oracle feature for Math Wizard.

## 1. Deploy the MathScroll.sol Contract to Monad Testnet

### Prerequisites
- MetaMask wallet with Monad testnet ETH
- Node.js and npm installed

### Setup Deployment Environment
1. Install Hardhat and dependencies:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
   ```

2. Add Monad testnet to MetaMask:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 0x1657 (decimal: 5719)
   - Currency Symbol: MON
   - Block Explorer URL: https://explorer.monad.xyz/

3. Create a `.env` file with your private key:
   ```
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   ```

4. Deploy the contract using Remix or Hardhat:
   
   **Option A: Using Remix (recommended for beginners)**
   - Go to [Remix IDE](https://remix.ethereum.org/)
   - Create a new file called `MathScroll.sol`
   - Copy the contract code from `contracts/MathScroll.sol`
   - Compile the contract
   - Connect Remix to MetaMask (Injected Web3 provider)
   - Deploy the contract
   - Note down the deployed contract address

   **Option B: Using Hardhat**
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network monad
   ```

## 2. Update the Contract Address in src/lib/monad.ts

Open `src/lib/monad.ts` and update line 22:
```typescript
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress"; // Replace with your deployed contract address
```

## 3. Create the math_scrolls Table in Supabase

1. Log in to your Supabase dashboard
2. Go to SQL Editor
3. Paste the contents of `scripts/create_math_scrolls_table.sql`:
   ```sql
   -- Create math_scrolls table for storing Monad NFTs
   CREATE TABLE IF NOT EXISTS public.math_scrolls (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     wallet_address TEXT NOT NULL,
     fortune_text TEXT NOT NULL,
     image_url TEXT NOT NULL,
     token_id TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX IF NOT EXISTS math_scrolls_wallet_address_idx ON public.math_scrolls (wallet_address);
   CREATE INDEX IF NOT EXISTS math_scrolls_token_id_idx ON public.math_scrolls (token_id);

   -- Add RLS policies
   ALTER TABLE public.math_scrolls ENABLE ROW LEVEL SECURITY;

   -- Policy to allow users to view their own math scrolls
   CREATE POLICY "Users can view their own math scrolls"
     ON public.math_scrolls
     FOR SELECT
     USING (auth.uid()::text = wallet_address);

   -- Policy to allow users to insert their own math scrolls
   CREATE POLICY "Users can insert their own math scrolls"
     ON public.math_scrolls
     FOR INSERT
     WITH CHECK (auth.uid()::text = wallet_address);

   -- Policy to allow users to update their own math scrolls
   CREATE POLICY "Users can update their own math scrolls"
     ON public.math_scrolls
     FOR UPDATE
     USING (auth.uid()::text = wallet_address);

   -- Create function to update the updated_at timestamp
   CREATE OR REPLACE FUNCTION update_modified_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Create trigger to update the updated_at timestamp
   CREATE TRIGGER update_math_scrolls_updated_at
   BEFORE UPDATE ON public.math_scrolls
   FOR EACH ROW
   EXECUTE FUNCTION update_modified_column();
   ```
4. Click "Run" to execute the SQL

## 4. Set Up Environment Variables

Create or update your `.env` file with these variables:

```
# Monad Testnet
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# Groq API
VITE_GROQ_API_KEY=your_groq_api_key

# Unsplash API
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# ImgFlip API (optional for meme generation)
VITE_IMGFLIP_USERNAME=your_imgflip_username
VITE_IMGFLIP_PASSWORD=your_imgflip_password

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Getting API Keys

### Groq API Key
1. Go to [Groq's website](https://console.groq.com/)
2. Sign up and create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your .env file

### Unsplash API Key
1. Go to [Unsplash Developer Portal](https://unsplash.com/developers)
2. Create a developer account
3. Create a new application
4. Copy the Access Key to your .env file

### ImgFlip Credentials (optional)
1. Go to [ImgFlip](https://imgflip.com/)
2. Create an account
3. Use your username and password in the .env file

### Supabase Keys
1. Open your Supabase project dashboard
2. Go to Project Settings > API
3. Copy the URL and anon/public key to your .env file

## 6. Start the Application

```bash
npm run dev
```

Navigate to the Math Oracle page by clicking on the Magic Wand icon in the navigation bar or by going to `/math-oracle`.

## Troubleshooting

### MetaMask Connection Issues
- Make sure you've added Monad testnet to MetaMask
- Check if you have testnet MON tokens
- Try resetting your MetaMask account in Settings > Advanced > Reset Account

### Contract Deployment Problems
- Verify your contract on the Monad Explorer
- Check transaction logs for errors
- Make sure you have enough MON for gas fees

### API Integration Issues
- Verify API keys are correctly set in your .env file
- Check browser console for API-related errors
- Make sure your API rate limits haven't been exceeded

## Next Steps
- Consider adding more features like fortune sharing or leaderboards
- Enhance your fortune generation with specialized math themes
- Add analytics to track the most popular math fortunes 