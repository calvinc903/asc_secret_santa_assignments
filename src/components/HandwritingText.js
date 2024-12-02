// components/HandwritingText.js
import { useEffect } from 'react';
import Vara from 'vara';

const HandwritingText = ({ text }) => {
  useEffect(() => {
    new Vara(
      '#vara-container',
      'https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json',
      [
        {
          text,
          fontSize: 40,
          strokeWidth: 0.7,
        },
      ]
    );

    return () => {
      // Cleanup Vara instance if necessary
    };
  }, [text]);

  return <div id="vara-container"></div>;
};

export default HandwritingText;