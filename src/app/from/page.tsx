'use client'
// pages/index.js

import HandwritingText from '../../components/HandwritingText.js';

const HomePage = () => {
  return (
    <div style={{ backgroundColor: '#f24236', height: '100vh', margin: 0 }}>
      <h1>Welcome to My Next.js App</h1>
      <HandwritingText text="Hello, World!" />
    </div>
  );
};

export default HomePage;