import { useState, useRef, useCallback } from 'react';

export const useTextArea = () => {
  const [textAreaValue, setTextAreaValue] = useState('');
  const textAreaRef = useRef(null);

  const updateTextAreaHeight = useCallback(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = Math.min(textAreaRef.current.scrollHeight, 120) + 'px';
    }
  }, []);

  const clearTextArea = useCallback(() => {
    setTextAreaValue('');
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
    }
  }, []);

  return {
    textAreaValue,
    setTextAreaValue,
    textAreaRef,
    updateTextAreaHeight,
    clearTextArea
  };
};
