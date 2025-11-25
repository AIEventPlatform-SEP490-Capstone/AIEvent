import { useCallback, useEffect, useRef, useState } from "react";

//Chuyển giọng nói thành văn bản bằng Web Speech API
export const useSpeechToText = ({ lang = "vi-VN", onResult } = {}) => {
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setIsSupported(true);

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          finalChunk += `${transcript} `;
        } else {
          interim += `${transcript} `;
        }
      }

      setInterimTranscript(interim.trim());

      const finalText = finalChunk.trim();
      if (finalText && typeof onResult === "function") {
        onResult(finalText);
      }
    };

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [lang, onResult]);

  const startRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isRecording) return;

    try {
      recognition.start();
    } catch (err) {
      // Safari throws if start called twice without stopping.
      if (err.message?.includes("start")) {
        recognition.stop();
        recognition.start();
      } else {
        setError(err.message || "Không thể bắt đầu thu âm");
      }
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.stop();
  }, []);

  return {
    isSupported,
    isRecording,
    interimTranscript,
    error,
    startRecording,
    stopRecording,
  };
};


