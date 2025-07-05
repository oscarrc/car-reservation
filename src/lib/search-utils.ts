/**
 * Search utilities for Firestore full-text search using array-contains-any
 * Based on approach from: https://erayerdin.com/no-i-aint-paying-for-full-text-search-implementing-full-text-search-in-firestore-clqr01a1h000a08l4g13j120g
 */

/**
 * Generates search keywords from a text string
 * @param text - The text to generate keywords from
 * @returns Array of lowercase keywords including original, split versions, and progressive prefixes
 */
export function generateSearchKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return [];
  }

  const keywords: string[] = [];
  
  // Add the original text (lowercase)
  keywords.push(trimmedText.toLowerCase());
  
  // Generate progressive prefixes for the entire text
  const progressivePrefixes = generateProgressivePrefixes(trimmedText);
  keywords.push(...progressivePrefixes);
  
  // Split by common delimiters and add each part
  const delimiters = /[\s.,\-_@+()\[\]{}|\\/:;!?#$%^&*=\[\]{}|\\/:;!?#$%^&*]/g;
  const parts = trimmedText.split(delimiters);
  
  parts.forEach(part => {
    const cleanPart = part.trim();
    if (cleanPart && cleanPart.length > 0) {
      // Add the clean part (lowercase)
      keywords.push(cleanPart.toLowerCase());
      
      // Generate progressive prefixes for each part
      const partPrefixes = generateProgressivePrefixes(cleanPart);
      keywords.push(...partPrefixes);
      
      // For parts that might contain more symbols, split further
      if (cleanPart.includes('.') || cleanPart.includes('-') || cleanPart.includes('_')) {
        const subParts = cleanPart.split(/[.\-_]/);
        subParts.forEach(subPart => {
          const cleanSubPart = subPart.trim();
          if (cleanSubPart && cleanSubPart.length > 0) {
            keywords.push(cleanSubPart.toLowerCase());
            
            // Generate progressive prefixes for sub-parts
            const subPartPrefixes = generateProgressivePrefixes(cleanSubPart);
            keywords.push(...subPartPrefixes);
          }
        });
      }
    }
  });

  // Remove duplicates and return
  return [...new Set(keywords)];
}

/**
 * Generates progressive prefixes for a text string based on separators
 * @param text - The text to generate prefixes for
 * @returns Array of progressive prefixes
 */
function generateProgressivePrefixes(text: string): string[] {
  const prefixes: string[] = [];
  
  // Find all separators and their positions
  const separators = /[\s.\-_]/g;
  const separatorMatches = [...text.matchAll(separators)];
  
  if (separatorMatches.length === 0) {
    // No separators - just return the text itself
    prefixes.push(text.toLowerCase());
    return prefixes;
  }
  
  // Generate progressive combinations with separators
  for (let i = 0; i <= separatorMatches.length; i++) {
    if (i === 0) {
      // Just the first part
      const firstPart = text.substring(0, separatorMatches[0].index);
      prefixes.push(firstPart.toLowerCase());
    } else if (i === separatorMatches.length) {
      // Full text
      prefixes.push(text.toLowerCase());
    } else {
      // Progressive combination up to the i-th separator (including the separator)
      const endIndex = separatorMatches[i].index;
      const combination = text.substring(0, endIndex);
      prefixes.push(combination.toLowerCase());
    }
  }
  
  return prefixes;
}

/**
 * Generates search keywords from multiple text fields
 * @param fields - Array of text fields to process
 * @returns Array of unique lowercase keywords
 */
export function generateSearchKeywordsFromFields(fields: (string | undefined)[]): string[] {
  const allKeywords: string[] = [];
  
  fields.forEach(field => {
    if (field) {
      allKeywords.push(...generateSearchKeywords(field));
    }
  });

  // Remove duplicates and return
  return [...new Set(allKeywords)];
}

/**
 * Prepares search terms for Firestore array-contains-any query
 * Limits to 30 terms as per Firestore constraint
 * @param searchTerm - The search term entered by user
 * @returns Array of search terms limited to 30 items
 */
export function prepareSearchTerms(searchTerm: string): string[] {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [];
  }

  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) {
    return [];
  }

  const terms: string[] = [];
  
  // Add the original search term (lowercase)
  terms.push(trimmedTerm.toLowerCase());
  
  // Generate progressive prefixes for the search term
  const progressivePrefixes = generateProgressivePrefixes(trimmedTerm);
  terms.push(...progressivePrefixes);
  
  // Split by spaces and add each word
  const words = trimmedTerm.split(/\s+/);
  words.forEach(word => {
    const cleanWord = word.trim();
    if (cleanWord && cleanWord.length > 0) {
      terms.push(cleanWord.toLowerCase());
      
      // Generate progressive prefixes for each word
      const wordPrefixes = generateProgressivePrefixes(cleanWord);
      terms.push(...wordPrefixes);
    }
  });

  // Remove duplicates and limit to 30 terms
  return [...new Set(terms)].slice(0, 30);
}

/**
 * Generates search keywords for a car document
 * @param car - Car object with model, licensePlate, and color fields
 * @returns Array of search keywords
 */
export function generateCarSearchKeywords(car: {
  model?: string;
  licensePlate?: string;
  color?: string;
}): string[] {
  return generateSearchKeywordsFromFields([
    car.model,
    car.licensePlate,
    car.color
  ]);
}

/**
 * Generates search keywords for a user document
 * @param user - User object with name, email fields
 * @returns Array of search keywords
 */
export function generateUserSearchKeywords(user: {
  name?: string;
  email?: string;
}): string[] {
  return generateSearchKeywordsFromFields([
    user.name,
    user.email
  ]);
}

/**
 * Generates search keywords for a reservation document
 * @param reservation - Reservation object with searchable fields
 * @returns Array of search keywords
 */
export function generateReservationSearchKeywords(reservation: {
  purpose?: string;
  destination?: string;
  notes?: string;
}): string[] {
  return generateSearchKeywordsFromFields([
    reservation.purpose,
    reservation.destination,
    reservation.notes
  ]);
} 