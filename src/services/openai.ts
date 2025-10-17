// OpenAI API service - using serverless function as proxy to keep API key secure
const OPENROUTER_PROXY_URL = '/api/openrouter';

export interface OpenAIRequest {
  groupName: string;
  groupContent: string;
  articles: Array<{
    name: string;
    category: string;
    count: number;
  }>;
  settings: {
    length: string;
    tone: string;
    style: string;
    language: string;
  };
  customPrompt?: string;
}

export const generateTextWithOpenAI = async (request: OpenAIRequest): Promise<string> => {

  // Build articles context
  const articlesContext = request.articles.map(article => 
    `${article.count}x ${article.name} (${article.category})`
  ).join(', ');

  // Create the prompt
  const prompt = `
  **WICHTIG: ANTWORTE AUSSCHLIESSLICH IN ${request.settings.language.toUpperCase()}!**
  
  ${request.settings.language === 'English' 
    ? `Goal: Create a concise, professional and appealing description for the service **"${request.groupName}"**. This description will be used in a service specification or proposal and should clearly and convincingly convey the service understanding to the customer.`
    : `Ziel: Erstelle eine prägnante, professionelle und ansprechende Beschreibung für die Leistung **"${request.groupName}"**. Diese Beschreibung wird in einem Leistungsverzeichnis oder Angebot verwendet und soll das Leistungsverständnis gegenüber dem Kunden klar und überzeugend vermitteln.`
  }

${request.settings.language === 'English' 
  ? 'Here are some examples of high-quality group texts:'
  : 'Hier sind einige Beispiele für hochwertige Gruppentexte:'
}

**Beispiel 1 - Audio Beschallung:**
User: Erstelle den Text für "Beschallungsanlage" auf deutsch
Assistant: Für die Location planen wir eine Beschallungsanlage, die eine gleichmäßige und angemessene Beschallung gewährleistet.

**Beispiel 2 - Light Atmospheric (English):**
User: Erstelle den Text für "Atmospheric Lighting" auf englisch
Assistant: Atmospheric lighting is achieved through the use of LED spotlights. Both extensive, wide illumination in the desired color scheme, as well as highlighting at prominent points of the event location is possible here.

**Beispiel 3 - Rigging Bühne:**
User: Erstelle den Text für "Bühne" auf deutsch
Assistant: Das Traversenraster über der Bühnenfläche schafft die Voraussetzung für die nötige Einbringung von Bühnenbeleuchtung, Frontbeschallung und Projektionsflächen.

**Beispiel 4 - Video Projektion:**
User: Erstelle den Text für "Projektion" auf deutsch
Assistant: Die Hauptprojektionsfläche im Format 4:3/16:9/16:10 misst einen Umfang von X x X m (bxh). Die Leinwand ist freistehend, auf einem Ständersystem, im Bühnenhintergrund platziert. Der Bildinhalt wird mittels eines Projektors aus dem Veranstaltungssaal auf die Leinwand projiziert.

**Beispiel 5 - Scenic Stage Construction (English):**
User: Erstelle den Text für "Stage Construction" auf englisch
Assistant: The offered stage will be built out of system decks and will be X cm high. Relating to the requirements of your event we will provide X stairways in front/on each side/in the back of the stage. The finish will be carpet/velours/dance floor in grey color.

**Beispiel 6 - Projektmanagement Planung:**
User: Erstelle den Text für "Planung & Vorbereitung" auf deutsch
Assistant: Wir überprüfen die technische Machbarkeit der Veranstaltung vorab, unter Beachtung der gesetzlichen Vorgaben und die örtlichen Gegebenheiten im Hinblick auf die baulichen Vorhaben der Produktion. Zudem werden alle notwendigen vorbereitenden Maßnahmen im Rahmen der Gefährdungs- und Sicherheitsanalyse durchgeführt.

${request.settings.language === 'English' 
  ? `
**CRITICAL RULES - RESPOND ONLY IN ENGLISH:**
- Language: ${request.settings.language} (MANDATORY!)
- Length: ${request.settings.length} (Kurz/Short: 1 sentences, Mittel/Medium: 2-3 sentences, Lang/Long: 4-5 sentences)
- Use the following current content for the group:`
  : `
**WICHTIGE REGELN:**
- Sprache: ${request.settings.language}
- Länge: ${request.settings.length} (Kurz: 1 Sätze, Mittel: 2-3 Sätze, Lang: 4-5 Sätze)
- Nutze die folgenden aktuellen Inhalte zur Gruppe:`
}
  ${request.groupContent}
${articlesContext ? `- Articles: ${articlesContext}` : ''}
${request.customPrompt ? `\n- Zusätzliche Anforderungen: ${request.customPrompt}` : ''}

${request.settings.language === 'English' 
  ? `
**IMPORTANT NOTES:**
- The text must NOT mention the group name again, as it is already included in the proposal/service specification
- Focus on clear structure, avoid platitudes, and use technical terminology where appropriate
- The description should clarify customer benefit and present the service offering coherently
- WRITE EXCLUSIVELY IN ENGLISH!`
  : `
**HINWEISE:**
- Der Text darf den Gruppennamen nicht erneut nennen, da dieser schon im Angebot bzw. Leistungsverzeichnis enthalten ist
- Achte auf eine klare Struktur, vermeiden von Floskeln, und gegebenenfalls technische Fachterminologie
- Die Beschreibung soll den Kundennutzen verdeutlichen und das Leistungsangebot schlüssig darstellen`
}

## **Explizit auszuschließende Artikel:**

### **Verbrauchsmaterialien & Kleinteile:**
- Klebebänder (Isolierband, Gaffa-Tape)
- Kabelbinder, Schrauben, Muttern
- Sicherungsseile, Safety-Kabel
- Adapter aller Art (XLR, HDMI, USB, etc.)
- Gender Changer, Verbinder
- Abschlusswiderstände
- Batterien, Akkus

### **Standard-Kabel & Verbindungen:**
- Alle Kabeltypen (Schuko, DMX, XLR, HDMI, SDI, Speakon, etc.)
- Kabeltrommeln, Kabelpauschalen
- Stromverteiler, Mehrfachsteckdosen
- Netzteile, Ladegeräte

### **Montage- & Rigging-Zubehör:**
- Schellen, Klemmen, Zapfen
- Bolzen, Clips, Verbinder
- Sch­äkel, Steelflex
- Bodenplatten, Gewichte, Sandsäcke
- Stativzubehör, Taschen für Stative

### **Werkzeuge & Hilfsmittel:**
- Akkuschrauber, Bits
- Leitern, Montagebocke
- Hammer, Werkzeugkoffer
- Ratschengurte

### **Cases & Transport:**
- Flightcases, Hauben­cases
- Leercases, Transporttaschen
- Cases für spezifische Geräte

### **Fernbedienungen & Kleinstzubehör:**
- Fernbedienungen (außer wenn funktional relevant)
- USB-Sticks, SD-Karten (außer für Recording)
- Mäuse, Tastaturen
- Kensington Locks

## **Allgemeine Regeln für die Textgenerierung:**

1. **Fokus auf Hauptkomponenten:** Nur die primären Geräte erwähnen (z.B. "8 ARRI Junior Scheinwerfer" statt Details zu jedem Stativ und Kabel)

2. **Keine technischen Montagedetails:** Traversenverbinder, Bodenplatten etc. nicht erwähnen

3. **Funktionalität statt Auflistung:** Beschreibe was erreicht wird, nicht womit es befestigt wird

4. **Beispiel-Transformation:**
   - **Statt:** "Die Gruppe enthält 24 Astera AX9 PowerPar, 24 Manfrotto Adapter, 24 Universalklemmen, 24 Flood Filter..."
   - **Besser:** "Die Ambientebeleuchtung erfolgt durch 24 akkubetriebene LED-Scheinwerfer mit anpassbaren Abstrahlwinkeln."

5. **Vermeidung von:**
   - Aufzählungen von Zubehör
   - Erwähnung von Sicherheitsequipment (wird vorausgesetzt)
   - Details zu Verkabelung
   - Verbrauchsmaterialien
   - Montage- und Befestigungsmaterial

Erzeuge den finalen Beschreibungstext:`;

  try {
    const response = await fetch(OPENROUTER_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: request.settings.language === 'English'
              ? 'You are a professional copywriter who creates high-quality proposals and service specifications. ALWAYS respond in the requested language!'
              : 'Du bist ein professioneller Texter, der hochwertige Angebote und Leistungsverzeichnisse erstellt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Fehler beim Generieren des Textes.';
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
};