![image](https://github.com/user-attachments/assets/701dc801-da79-4438-985d-4ab85b3b3326)


# 🚀 SolvYaar - AI-Powered Math Learning Platform

> Transforming how students learn math through interactive exercises and personalized AI assistance

---

## 📌 Problem Statement

**Problem Statement 1 – Weave AI magic with Groq**

**Problem Statement 2 – Unleash blockchain gameplay with Monad**

**Problem Statement 3 – Real-Time Data Experiences with Fluvio**

---

## 🎯 Objective

SolvYaar addresses the challenges students face when learning mathematics by providing an AI-powered platform that transforms abstract mathematical concepts into engaging, interactive experiences. Our platform serves as a personalized math companion that adapts to individual learning styles, offering instant problem-solving assistance, concept explanations, and interactive visualizations.

### Key Objectives:

* To make mathematics more accessible and less intimidating through personalized AI assistance
* To provide instant, step-by-step solutions to complex math problems with clear explanations
* To offer interactive visualizations that help students understand abstract mathematical concepts
* To create an engaging learning environment through gamification and achievement systems
* To support different learning styles with multiple AI personas specializing in various mathematical approaches
* To build student confidence in mathematics through gradual skill development and positive reinforcement
* To supplement traditional classroom learning with on-demand assistance available 24/7

SolvYaar isn't just a problem-solving tool—it's a comprehensive math learning ecosystem designed to foster mathematical curiosity, build confidence, and develop critical thinking skills that extend beyond the classroom.
## 🧠 Team & Approach

### Team Name:

`Neural Nexuss`

### Team Members:

* BhavnaKumari Solanki ([Github](https://github.com/Bhavnakumari-solanki-15))([LinkedIn](https://www.linkedin.com/in/bhavna-solanki-a03b8728a/))
* Shravan Gupta ([Github](https://github.com/ShravanGupta07))([LinkedIn](https://www.linkedin.com/in/shravan-gupta-b785712a5/))
* Vipul Gavade ([Github](https://github.com/rustyy1))([LinkedIn](https://www.linkedin.com/in/vipul-gavade-1b788826b/))

### Your Approach:

**Why you chose this problem:** 
Mathematics education faces significant challenges with high student anxiety, abstract concept visualization difficulties, and limited personalized support. We recognized the opportunity to create an AI-powered platform that transforms how students interact with mathematics. By leveraging Groq's powerful AI for instant problem-solving and personalized explanations, implementing engaging visualizations, and incorporating gamification elements with blockchain-based achievements, we aimed to make mathematics more accessible and enjoyable. Our vision was to build a comprehensive math companion that adapts to individual learning styles while providing immediate, accurate assistance.

**Key challenges you addressed:**

* **AI Model Integration (Groq):** Implementing Groq's LLM for multiple specialized mathematics functions required sophisticated prompt engineering and context management. We created distinct mathematical personas (like Pytha-Gawd and Chaos Calculus), developed a robust problem-solving pipeline for step-by-step solutions, and optimized response formats for mathematical notation. Highlight: Achieved highly accurate problem solutions with explanations tailored to different learning levels.

* **Blockchain Achievement System (Monad):** Implementing a blockchain-based achievement system using Monad's testnet presented significant engineering challenges. We developed multiple Solidity smart contracts (BadgeNFT.sol, PracticeAchievements.sol, MathScroll.sol) for minting achievement badges as NFTs when users accomplish learning milestones. The integration with MetaMask required careful handling of network configurations and chain IDs to ensure smooth wallet connections, with proper error handling for various network scenarios.

* **Real-Time Data Processing (Fluvio):** Setting up Fluvio for real-time data streaming enhanced our system's responsiveness. We implemented a full client-server architecture with producers and consumers to handle event-based communication. The Fluvio integration enabled efficient streaming of math queries and responses, despite deployment challenges in the WSL environment that required developing fallback mechanisms for reliability.

* **Mathematical Visualization Engine:** Developing interactive visualizations for complex mathematical concepts presented significant technical challenges in rendering equations, graphs, and geometric shapes. We implemented a custom rendering pipeline using D3.js and MathJax to create dynamic, interactive visualizations that respond to user input and illustrate abstract concepts concretely.

* **Persona-Based Learning System:** Creating distinct mathematical personas with unique teaching styles required developing a sophisticated context management system. Each persona maintains conversation history, adapts to the user's demonstrated knowledge level, and presents information through a consistent pedagogical approach tailored to different learning styles.

**Pivots, brainstorms, and breakthroughs during development:**

* Initially focused on a simple problem-solver but pivoted to a comprehensive learning platform after user feedback indicated the need for more guided learning experiences.
* Engineering breakthrough in implementing the Monad blockchain integration that required developing multiple chain ID configuration approaches to handle MetaMask's inconsistent network addition behavior.
* Developed a hybrid approach to Fluvio integration with fallback mechanisms to ensure the application remains functional even when Fluvio isn't available in the deployment environment.
* Created an innovative "Math Chaos" section featuring AI-powered math personas, meme generators, and "hot takes" to make mathematics more engaging and culturally relevant.
* Successfully designed a gamified achievement system where blockchain-based badges serve as permanent proof of mathematical accomplishments, incentivizing continued learning.
---

## 🛠️ Tech Stack

### Core Technologies Used:

* **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
* **Backend:** [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), WebSocket for real-time communication
* **Real-Time Streaming:** [Fluvio](https://www.fluvio.io/) (with fallback mechanisms in WSL)
* **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
* **AI Engine:** [Groq API](https://groq.com/) (for math problem solving, persona chats, and content generation)
* **Blockchain:** [Solidity](https://soliditylang.org/) smart contracts (`BadgeNFT.sol`, `PracticeAchievements.sol`), [Ethers.js](https://docs.ethers.org/), [Monad](https://www.monad.xyz/) Testnet
* **APIs:** [Unsplash API](https://unsplash.com/developers) (image backgrounds), [Imgflip API](https://imgflip.com/api) (meme generation), Supabase API
* **Libraries:** [MathJax](https://www.mathjax.org/)/[KaTeX](https://katex.org/) (math rendering), [D3.js](https://d3js.org/) (visualizations), [React Router](https://reactrouter.com/)
* **State Management:** React Context API, Custom Hooks
* **Authentication:** [Supabase Auth](https://supabase.com/auth)
* **Hosting:** [Vercel](https://vercel.com/)
### Sponsor Technologies Used:

* [✅] **Groq:** Powers the AI-driven math assistance features (problem solving, explanations, personas) via `src/services/groqService.ts`. Enables fast response times for complex mathematical queries, generates creative math content for the Math Chaos section (`src/components/math-chaos`), and provides accurate step-by-step solution explanations.
   * **Impact:** Enables sophisticated AI features central to the platform's intelligence and responsive user interaction, creating personalized learning experiences.

* [✅] **Monad:** Used for blockchain-based achievement badges system. Deployed `BadgeNFT.sol`, `PracticeAchievements.sol`, and `MathScroll.sol` (Solidity contracts) to the Monad Testnet. Frontend interaction via Ethers.js from `src/lib/monad.ts` and achievement services from `src/services/badgeService.ts`.
   * **Impact:** Demonstrates seamless integration of EVM-compatible blockchain for novel achievement tracking features, allowing students to own verifiable proof of their mathematical accomplishments.

* [✅] **Fluvio/InfinyOn:** Enables real-time data streaming for math queries and responses. Server-side implementation in `server/lib/fluvio.ts` acts as producer sending events to Fluvio topics. A separate backend service (`server/fluvio-consumer.ts`) consumes these topics and processes mathematical data.
   * **Impact:** Powers real-time features, creating a responsive math learning experience with immediate feedback and dynamic content updates.

* [❌] **Base:** AgentKit / OnchainKit / Smart Wallet usage (Not implemented)

* [❌] **Screenpipe:** Screen-based analytics or workflows (Not implemented)

* [❌] **Stellar:** Payments, identity, or token usage (Not implemented)

---
## ✨ Key Features

* ✅ **AI-Powered Math Solver (Groq):** Get step-by-step solutions to complex math problems with detailed explanations powered by fast Groq inference.

* ✅ **Math Personas Chat:** Interact with unique AI math mentors with distinct personalities and teaching styles - from the ancient meme lord Pytha-Gawd to the dramatic Chaos Calculus.

* ✅ **Blockchain Achievement System (Monad):** Earn and mint unique NFT badges on the Monad Testnet when you master mathematical concepts, with full MetaMask wallet integration.

* ✅ **Real-Time Data Streaming (Fluvio):** Experience responsive math query processing through Fluvio's real-time data streaming technology, enabling instant feedback and updates.

* ✅ **Interactive Visualizations:** Understand abstract mathematical concepts through dynamic, interactive visualizations and simulations.

* ✅ **Formula Library:** Access a comprehensive collection of mathematical formulas with explanations and example applications.

* ✅ **Math Meme Creator (Imgflip, Groq):** Generate humorous mathematics-related memes using AI-powered content generation and the Imgflip API.

* ✅ **Math Hot Takes:** Explore provocative mathematical opinions and vote on your favorites, encouraging critical thinking about mathematical concepts.

* ✅ **Transform Trek Game with Blockchain Integration:** Play through an interactive game that teaches mathematical transformations and earn Monad blockchain badges for completing levels.

* ✅ **Math Achievement NFTs:** View and showcase your mathematical accomplishments as permanent NFT badges on the Monad blockchain, visible in your profile.

* ✅ **Analytics Dashboard with Real-Time Updates:** View detailed statistics about formula usage, topics explored, and complexity of problems solved with interactive charts and visualizations powered by Fluvio's streaming capabilities.

* ✅ **Practice Exercises with Blockchain Rewards:** Test your skills across various mathematical domains and earn blockchain-based badges for your performance.

* ✅ **User Profiles with NFT Collection:** Track your earned blockchain achievements and mathematical progress in your personalized profile.

* ✅ **Secure Authentication (Supabase):** Robust login/signup with email or social providers to save your progress and blockchain-based achievements.
---
## 📽️ Demo & Screenshots

### 1. Home Page:

![image](https://github.com/user-attachments/assets/e2475ea7-36a5-4e90-b19b-a80c2d87f4ff)

### 2. Math Solver Interface:

![image](https://github.com/user-attachments/assets/2d781a10-7efa-4556-89ec-0c56d4b5adf8)

### 3. Personas Chat:

![image](https://github.com/user-attachments/assets/94fe6bf3-d338-4cef-8671-8597aab02e09)

### 4.Dashboard:

![image](https://github.com/user-attachments/assets/107057f4-53a6-4361-9bcd-5c85ab4a2139)

### 5.Science Visualization
**Chemistry:**
![image](https://github.com/user-attachments/assets/378570ab-298b-4fee-b900-18f512c395ad)
**Physics:**
![image](https://github.com/user-attachments/assets/b384094f-05f3-435a-8c3c-7b835c27fb3e)
**Biology:**
![image](https://github.com/user-attachments/assets/c62d19ac-888c-4c65-8781-d87c7d17fd0a)

### 6. Math Oracle
![image](https://github.com/user-attachments/assets/8c012452-ff8b-4c1f-8b32-ac8019761750)

## 📊Flowchart
**Technical Structure & Interface Flow Charts**
### 1. User flow 
![user flow](https://github.com/user-attachments/assets/334b2b80-1109-407c-bb08-1aa83d50b83d)
### 2. Groq AI flow
![Untitled diagram-2025-04-23-184703](https://github.com/user-attachments/assets/599348a2-31b7-4f92-bc3d-93c479b24fb5)
### 3. Real-time Dataflow using fluvio(Dashboard)
![Fluvio](https://github.com/user-attachments/assets/e863d6ee-ba8e-4089-92ee-1041d8e52a43)
### 4. Monad Blockchain Interaction(Math Oracle)
![Blockchain Integration Dataflow](https://github.com/user-attachments/assets/7bf98a04-4d58-4a3c-a81a-34b8d9deb0ef)
### 5. Secure Data Architecture
![Untitled diagram-2025-04-23-184432](https://github.com/user-attachments/assets/42d7720a-33b1-4b5d-b66b-ae88335c6be8)
### 6. Overall Workflow Architecture
![Overal](https://github.com/user-attachments/assets/beb32230-abe5-4d2a-8c3a-4c2e5298ac29)


---
📽️ Demo and Deliverables
* **Demo Video Link:** [Youtube Link](https://youtu.be/)
* **Live Site:** [SolvYaar](https://solvyaar-web.netlify.app/)
* **GitHub Repository:** [SolvYaar-Clean](https://github.com/Bhavnakumari-solanki-15/SolvYaar-Clean)
* **PPT Link:**[PPT](https://solvyaar.netlify.app/)

---

## ✅ Tasks & Bonus Checklist

* [✅] All members of the team completed the mandatory task - Followed at least 2 of our social channels and filled the form *(Details in Participant Manual)*
* [✅] All members of the team completed Bonus Task 1 - Sharing of Badges and filled the form (2 points) *(Details in Participant Manual)*
* [✅] All members of the team completed Bonus Task 2 - Signing up for Sprint.dev and filled the form (3 points) *(Details in Participant Manual)*

---

## 🧪 How to Run the Project

### Requirements:

* Node.js v18+
* npm or yarn
* Supabase account
* Groq API key
* Fluvio account for real-time data streaming
* MetaMask wallet for blockchain integration
* API Keys for Unsplash and Imgflip

### Environment Variables (.env):

Create a `.env` file in the project root with the following configuration:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=your_api_base_url
VITE_FLUVIO_WSL_IP=your_wsl_ip

# Your MetaMask private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Groq API Configuration
VITE_GROQ_API_KEY=your_groq_api_key
VITE_IMGFLIP_USERNAME=your_imgflip_username
VITE_IMGFLIP_PASSWORD=your_imgflip_password
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Monad Testnet Configuration
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143

# Optional: Customize these values for your deployment
VITE_APP_NAME=SolvYaar
VITE_APP_DESCRIPTION=AI-Powered Math Learning Platform
VITE_APP_VERSION=1.0.0
```

*(See `src/lib/monad.ts`, `server/lib/fluvio.ts`, and `src/services/groqService.ts` for reference on how these variables are used)*

### Local Setup:

#### 1. Frontend Setup
```bash
# Clone the repository
git clone https://github.com/Bhavnakumari-solanki-15/SolvYaar-Clean.git
cd SolvYaar-Clean

# Install dependencies
npm install

# Create .env file in the project root as described above

# Start the frontend development server
npm run dev
```

#### 2. Backend Server Setup
```bash
# Open a new terminal window (keep the frontend running)
cd SolvYaar-Clean/server

# Install backend dependencies
npm install

# Setup Fluvio in WSL (if using Windows)
./install-fluvio.bat

# Start the backend server
npm run start:server
```

#### 3. Blockchain Integration Setup
```bash
# Open a new terminal window
cd SolvYaar-Clean

# Deploy the smart contracts to Monad Testnet
# (Make sure you have your private key in .env)
npx hardhat run scripts/deploy.js --network monad

# Update the contract addresses in src/lib/monad.ts with newly deployed addresses
```

#### 4. Testing the Entire Stack
1. The frontend will be available at http://localhost:5173
2. The backend server will be running on http://localhost:3000
3. Connect your MetaMask wallet to interact with the blockchain features
4. Ensure WSL is properly configured if using Fluvio on Windows

#### 5. Troubleshooting
- If Fluvio fails to start in WSL, you can use the fallback server by setting `WITH_FLUVIO=false` in your server environment
- Check the backend logs for any connection issues with Supabase or Groq APIs
- Ensure your MetaMask is configured for the Monad Testnet (Chain ID: 10143)

The application uses Supabase for database and authentication, Groq for AI features, Fluvio for real-time data streaming, and Monad blockchain for the achievement system. All components must be properly configured for full functionality.

---

## 🧬 Future Scope

* 🔐 **Advanced Security Framework:** Implement quantum-resistant encryption methods for user data protection, sophisticated credential management, and comprehensive audit logging systems to ensure maximum security for educational content.

* 📊 **Predictive Learning Analytics:** Create an advanced analytics system utilizing machine learning to predict knowledge gaps, recommend personalized learning paths, and provide educators with actionable insights on student progress.

* 🤝 **Collaborative Learning Platform:** Build real-time collaboration features allowing students to work together on complex problems, share solutions, and participate in guided group learning sessions with AI facilitation.

* 🧩 **Cross-Discipline Integration:** Expand beyond pure mathematics to include physics, engineering, computer science, and economics applications, demonstrating the practical relevance of mathematical concepts in various fields.

* 🧠 **Cognitive Science Integration:** Incorporate findings from neuroscience and cognitive psychology to optimize learning intervals, problem presentation, and feedback mechanisms based on proven retention strategies.

* 🏆 **Institutional Licensing Program:** Develop comprehensive enterprise solutions for schools and universities with advanced administrative controls, curriculum alignment tools, and integration with existing educational technology ecosystems.

---

## 📎 Resources / Credits

* **Frameworks/Libraries:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Ethers.js](https://docs.ethers.org/), [React Router](https://reactrouter.com/), [MathJax](https://www.mathjax.org/), [KaTeX](https://katex.org/), [D3.js](https://d3js.org/), [Recharts](https://recharts.org/), [React Hook Form](https://react-hook-form.com/), [Lucide React Icons](https://lucide.dev/)

* **Services:** [Supabase](https://supabase.com/) (Database & Auth), [Groq](https://groq.com/) (AI Inference), [Fluvio](https://www.fluvio.io/) (Real-time Data Streaming), [Vercel](https://vercel.com/) (Hosting), [Imgflip API](https://imgflip.com/api) (Meme Generation), [Unsplash API](https://unsplash.com/developers) (Image Resources)

* **Blockchain:** [Monad](https://www.monad.xyz/) Testnet, [OpenZeppelin](https://www.openzeppelin.com/) Contracts, [MetaMask](https://metamask.io/) Integration

* **Mathematical Resources:** [Wolfram Alpha](https://www.wolframalpha.com/) (Reference Implementation), [Paul's Online Math Notes](https://tutorial.math.lamar.edu/) (Educational Content), [3Blue1Brown](https://www.3blue1brown.com/) (Visualization Inspiration)

* **Design Resources:** [Figma](https://www.figma.com/) (UI Design), [Huemint](https://huemint.com/) (Color Palette Generation), [Icon8](https://icons8.com/) (Additional Icons)

* **Special Thanks:** To the [Groq team](https://groq.com/) for their LLM APIs, [Monad network](https://www.monad.xyz/) for blockchain support, and the open source community for their invaluable contributions to the libraries and frameworks that made this project possible.

---

## 🏁 Final Words

Developing SolvYaar as a comprehensive AI-powered math learning platform has been an exhilarating and challenging journey. Our biggest challenge was creating a seamless integration between multiple cutting-edge technologies: Groq's powerful AI for mathematical problem-solving and personalized tutoring, Monad blockchain for verifiable achievement badges, and Fluvio's real-time data streaming for responsive learning experiences.

The most rewarding moments came when we witnessed students having "aha!" moments while interacting with our math personas, successfully solving problems they previously struggled with, and proudly displaying their blockchain-verified achievement badges. Seeing the excitement on users' faces when they created their first math meme or received step-by-step explanations tailored to their learning style validated our vision of making mathematics more accessible and enjoyable.

Throughout development, we continually refined our approach based on user feedback – enhancing visualization capabilities, expanding the formula library, and optimizing the AI response quality for mathematical content. The integration of blockchain technology presented unique challenges in creating a seamless user experience, but ultimately provided a novel way to recognize and celebrate mathematical achievement.

SolvYaar represents our belief that technology can transform how we experience mathematics – not just as a subject to be studied, but as a creative, engaging, and rewarding journey of discovery. We're grateful to the hackathon organizers and technology partners who made this possible, and excited about the potential to expand SolvYaar's impact on mathematical education worldwide.

---
