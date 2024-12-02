// components/HandwritingText.js
import { useEffect } from 'react';
import Vara from 'vara';

const HandwritingText = ({ text }) => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vara = new Vara(
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