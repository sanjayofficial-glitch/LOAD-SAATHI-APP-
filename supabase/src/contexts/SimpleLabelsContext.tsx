import { createContext, useContext } from 'react';

type TranslationMap = Record<string, string>;

const HINDI_LABELS: TranslationMap = {
  'Origin': 'कहां से',
  'Destination': 'कहां तक',
  'Weight': 'भार',
  'Price': 'कीमत',
  'Date': 'तारीख',
  'Vehicle Type': 'वाहन का प्रकार',
  'Vehicle Number': 'वाहन नंबर',
  'Capacity': 'क्षमता',
  'Post Trip': 'ट्रिप डालें',
  'Post Shipment': 'शिपमेंट डालें',
  'From': 'से',
  'To': 'तक',
  'Departure Date': 'प्रस्थान तारीख',
  'Available Capacity': 'उपलब्ध क्षमता',
  'Price per Tonne': 'टन की कीमत',
  'Budget per Tonne': 'टन का बजट',
  'Goods Description': 'माल का विवरण',
  'Ready Date': 'तैयारी की तारीख',
  'Pickup Address': 'पिकअप पता',
  'Delivery Address': 'डिलीवरी पता',
  'Tonnes': 'टन',
  'Ton': 'टन',
  'Search': 'खोजें',
  'Clear': 'हटाएं',
  'Filters': 'फ़िल्टर',
  'Sort by': 'क्रमबद्ध करें',
  'Best Match': 'सबसे अच्छा मैच',
  'Accept': 'स्वीकार करें',
  'Decline': 'अस्वीकार करें',
  'View Details': 'विवरण देखें',
  'Send Offer': 'ऑफर भेजें',
  'Find Loads': 'लोड खोजें',
  'Show me loads': 'लोड दिखाएं',
  'No loads available': 'कोई लोड उपलब्ध नहीं',
  'Post a trip to start finding loads': 'लोड खोजने के लिए ट्रिप डालें',
  'Back': 'वापस',
};

const SimpleLabelsContext = createContext<TranslationMap>(HINDI_LABELS);

export const SimpleLabelsProvider = SimpleLabelsContext.Provider;

export function useSimpleLabels(): TranslationMap {
  return useContext(SimpleLabelsContext);
}

export function t(key: string): string {
  return HINDI_LABELS[key] || key;
}
