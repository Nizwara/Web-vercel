export function getEmojiFlag(countryCode: string): string {
  // This is a simplified version - in production, you'd want a more robust solution
  // Convert country code to regional indicator symbols
  // For example, 'US' becomes '🇺🇸'
  if (!countryCode || countryCode.length !== 2) {
    return "🏳️"
  }

  const offset = 127397
  const firstChar = countryCode.toUpperCase().charCodeAt(0)
  const secondChar = countryCode.toUpperCase().charCodeAt(1)

  return String.fromCodePoint(firstChar + offset) + String.fromCodePoint(secondChar + offset)
}

