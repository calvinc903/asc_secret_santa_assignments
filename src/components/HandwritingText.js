// components/HandwritingText.js
import { useEffect } from 'react';
import Vara from 'vara';

const HandwritingText = ({ text }) => {
  useEffect(() => {
    const container = document.getElementById('vara-container');
    if (container) {
      container.innerHTML = '';
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vara = new Vara(
      '#vara-container',
      'https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json',
      [
      {
        text,
        fontSize: 50,
        strokeWidth: 1.5,
        color: '#FFFFFF',
        textAlign: "center",
      },
      ]
    );

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [text]);

  return <div id="vara-container" style={{ minHeight: '80px', width: '100%' }}></div>;
};

export default HandwritingText;