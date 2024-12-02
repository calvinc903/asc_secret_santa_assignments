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
        fontSize: 50,
        strokeWidth: 1.5,
        color: '#FFFFFF',
        textAlign: "center",
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