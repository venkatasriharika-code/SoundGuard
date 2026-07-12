import { useState, useCallback } from "react";

type Language = "english" | "hindi" | "telugu" | "tamil";

interface LanguageConfig {
  code: string;
  lang: string;
  voiceIndex: number; // Index of voice to use
}

const languageConfigs: Record<Language, LanguageConfig> = {
  english: { code: "en-US", lang: "en-US", voiceIndex: 0 },
  hindi: { code: "hi-IN", lang: "hi-IN", voiceIndex: 0 },
  telugu: { code: "te-IN", lang: "te-IN", voiceIndex: 0 },
  tamil: { code: "ta-IN", lang: "ta-IN", voiceIndex: 0 },
};

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAdvisoryText = useCallback(
    (issueType: string, language: Language, costNow: number = 0, costLater: number = 0): string => {
      const savingsAmount = costLater - costNow;

      const advisories: Record<string, Record<Language, string>> = {
        bearing_wear: {
          english: `Bearing wear detected. Repair now to save Rs ${savingsAmount} in emergency costs. Schedule maintenance immediately.`,
          hindi: `बेयरिंग पहनना पाया गया। अभी मरम्मत करें और Rs ${savingsAmount} बचाएं। तुरंत रखरखाव की व्यवस्था करें।`,
          telugu: `బేరింగ్ ధరించడం గుర్తించబడింది. ఇప్పుడే మరమ్మత్తు చేయండి మరియు Rs ${savingsAmount} సేవ్ చేయండి. వెంటనే నిర్వహణను షెడ్యూల్ చేయండి.`,
          tamil: `தாங்கு தேய்மானம் கண்டறியப்பட்டது. இப்போது சரிசெய்து Rs ${savingsAmount} சேமிக்கவும். உடனே பராமரிப்பை திட்டமிடவும்.`,
        },
        lubrication_needed: {
          english: `Lubrication needed. Apply lubricant immediately to prevent damage and save Rs ${savingsAmount}.`,
          hindi: `स्नेहन की आवश्यकता है। नुकसान से बचने के लिए तुरंत स्नेहक लागू करें और Rs ${savingsAmount} बचाएं।`,
          telugu: `సరళీకరణ అవసరం. నష్టం నుండి రక్షించుకోవడానికి వెంటనే నూనెను వర్తించండి మరియు Rs ${savingsAmount} సేవ్ చేయండి.`,
          tamil: `உயவு தேவை. சேதத்தைத் தடுக்க உடனே உயவு பயன்படுத்தவும் மற்றும் Rs ${savingsAmount} சேமிக்கவும்.`,
        },
        alignment_issue: {
          english: `Machine alignment issue detected. Check and recalibrate immediately to save Rs ${savingsAmount} in repairs.`,
          hindi: `मशीन संरेखण समस्या पाई गई। तुरंत जांचें और पुनः कैलिब्रेट करें, Rs ${savingsAmount} बचाएं।`,
          telugu: `మెషిన్ సమలేఖన సమస్య కనుగొనబడింది. వెంటనే తనిఖీ చేయండి మరియు Rs ${savingsAmount} సేవ్ చేయడానికి పునः క్రమాంకనం చేయండి.`,
          tamil: `இயந்திர சீரமைப்பு சிக்கல் கண்டறியப்பட்டது. உடனே சரிபார்க்கவும் மற்றும் Rs ${savingsAmount} சேமிக்க மீண்டும் அளவீடு செய்யவும்.`,
        },
        normal: {
          english: `Machine is operating normally. No issues detected. Continue monitoring.`,
          hindi: `मशीन सामान्य रूप से काम कर रही है। कोई समस्या नहीं। निगरानी जारी रखें।`,
          telugu: `యంత్రం సామాన్యంగా పనిచేస్తోంది. ఎటువంటి సమస్యలు లేవు. పర్యవేక్షణ కొనసాగించండి.`,
          tamil: `இயந்திரம் சாதாரணமாக இயங்குகிறது. எந்த சிக்கலும் இல்லை. கண்காணிப்பு தொடரவும்.`,
        },
      };

      return advisories[issueType]?.[language] || advisories.normal[language] || advisories.normal.english;
    },
    []
  );

  const speak = useCallback(
    async (text: string, language: Language = "english") => {
      try {
        setError(null);
        setIsPlaying(true);

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const config = languageConfigs[language];
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = config.lang;
        utterance.rate = 0.9; // Slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find the best voice for the language
        const voices = window.speechSynthesis.getVoices();
        const languageVoices = voices.filter((v) => v.lang.startsWith(config.code.split("-")[0]));

        if (languageVoices.length > 0) {
          utterance.voice = languageVoices[0];
        } else if (voices.length > 0) {
          // Fallback to first available voice
          utterance.voice = voices[0];
        }

        utterance.onend = () => {
          setIsPlaying(false);
        };

        utterance.onerror = (event) => {
          setIsPlaying(false);
          setError(`Speech error: ${event.error}`);
          console.error("Speech synthesis error:", event.error);
        };

        // Speak
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        setIsPlaying(false);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("TTS Error:", errorMessage);
      }
    },
    []
  );

  const playAdvisory = useCallback(
    async (issueType: string, language: Language, costNow: number = 0, costLater: number = 0) => {
      const text = generateAdvisoryText(issueType, language, costNow, costLater);
      await speak(text, language);
    },
    [generateAdvisoryText, speak]
  );

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    error,
    speak,
    playAdvisory,
    stop,
    generateAdvisoryText,
  };
}
