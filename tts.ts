import { Router, Request, Response } from "express";
import axios from "axios";

const router = Router();

// Language mappings for Google Cloud TTS
const languageMap: Record<string, { code: string; voice: string }> = {
  english: { code: "en-US", voice: "en-US-Neural2-A" },
  hindi: { code: "hi-IN", voice: "hi-IN-Neural2-A" },
  telugu: { code: "te-IN", voice: "te-IN-Neural2-A" },
  tamil: { code: "ta-IN", voice: "ta-IN-Neural2-A" },
};

// Generate advisory text based on issue type
function getAdvisoryText(
  issueType: string,
  language: string,
  costNow: number,
  costLater: number
): string {
  const savingsAmount = costLater - costNow;

  const advisories: Record<string, Record<string, string>> = {
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
      telugu: `యంత్రం సामान్యంగా పనిచేస్తోంది. ఎటువంటి సమస్యలు లేవు. పర్యవేక్షణ కొనసాగించండి.`,
      tamil: `இயந்திரம் சாதாரணமாக இயங்குகிறது. எந்த சிக்கலும் இல்லை. கண்காணிப்பு தொடரவும்.`,
    },
  };

  return (
    advisories[issueType]?.[language] || advisories.normal[language] || advisories.normal.english
  );
}

// Generate TTS audio using a simple approach
// In production, integrate with Google Cloud TTS or AWS Polly
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { issueType, language, costNow, costLater } = req.body;

    if (!issueType || !language) {
      return res.status(400).json({ error: "Missing issueType or language" });
    }

    const text = getAdvisoryText(issueType, language, costNow || 0, costLater || 0);

    // For demo purposes, we'll create a simple audio response
    // In production, call Google Cloud TTS API:
    // const response = await googleTTS.synthesizeSpeech({
    //   input: { text },
    //   voice: { languageCode: languageMap[language].code, name: languageMap[language].voice },
    //   audioConfig: { audioEncoding: 'MP3' },
    // });

    // Return the advisory text and metadata
    // The frontend will use Web Speech API or a TTS library to play it
    res.json({
      text,
      language,
      issueType,
      languageCode: languageMap[language]?.code || "en-US",
      voiceName: languageMap[language]?.voice || "en-US-Neural2-A",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("TTS generation error:", error);
    res.status(500).json({ error: "Failed to generate TTS" });
  }
});

export default router;
