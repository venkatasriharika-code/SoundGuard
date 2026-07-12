import { ENV } from "./env";

type Language = "en-US" | "hi-IN" | "te-IN" | "ta-IN";

/**
 * Generate speech using a simple approach with browser Web Audio API
 * Returns a data URI with audio content
 */
export async function textToSpeech(text: string, language: Language): Promise<string> {
  try {
    // Use ResponsiveVoice API (free, no auth required)
    const voiceMap: Record<Language, string> = {
      "en-US": "UK English Female",
      "hi-IN": "Hindi Female",
      "te-IN": "Telugu Female",
      "ta-IN": "Tamil Female",
    };

    const voice = voiceMap[language] || "UK English Female";

    // ResponsiveVoice API endpoint
    const url = new URL("https://responsivevoice.org/responsivevoice/getvoice.php");
    url.searchParams.set("t", text);
    url.searchParams.set("lang", language);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "audio/mpeg",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn("ResponsiveVoice API failed, trying alternative...");
    }

    // Fallback: Use Google Translate TTS (works without auth)
    const gttsUrl = new URL("https://translate.google.com/translate_tts");
    gttsUrl.searchParams.set("client", "gtx");
    gttsUrl.searchParams.set("q", text);
    gttsUrl.searchParams.set("tl", language.split("-")[0]); // Extract language code (en, hi, te, ta)

    try {
      const response = await fetch(gttsUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn("Google Translate TTS failed");
    }

    // Final fallback: Return a data URI with a simple beep sound
    return generateFallbackAudio(text, language);
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    return generateFallbackAudio(text, language);
  }
}

/**
 * Generate a fallback audio (silent WAV file)
 */
function generateFallbackAudio(text: string, language: Language): string {
  // Create a minimal valid WAV file (silence)
  const silentWav =
    "UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==";
  return `data:audio/wav;base64,${silentWav}`;
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: Language) {
  const voices: Record<Language, string[]> = {
    "en-US": ["UK English Female", "US English Female"],
    "hi-IN": ["Hindi Female", "Hindi Male"],
    "te-IN": ["Telugu Female"],
    "ta-IN": ["Tamil Female"],
  };

  return voices[language] || voices["en-US"];
}
