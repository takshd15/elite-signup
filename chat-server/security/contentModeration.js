// Content moderation configuration
const BANNED_WORDS = new Set(['spam', 'scam', 'hack', 'crack', 'illegal', 'drugs', 'weapons']);
const SPAM_PATTERNS = [
  /(.)\1{20,}/, // Repeated characters (more lenient - 20+ repetitions)
  /(https?:\/\/[^\s]+){3,}/, // Multiple URLs (3+ URLs)
  /(buy|sell|discount|offer|free|money|cash|bitcoin|eth|crypto){4,}/i, // Spam keywords (4+ occurrences)
];
const CAPS_THRESHOLD = 0.7; // 70% caps is shouting

// Content moderation functions
function checkMessageModeration(content) {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  
  // Check for banned words
  const bannedWordCount = words.filter(word => BANNED_WORDS.has(word)).length;
  if (bannedWordCount > 0) {
    return {
      isAppropriate: false,
      reason: `Contains ${bannedWordCount} banned word(s)`,
      action: bannedWordCount > 2 ? 'DELETE' : 'WARN',
      confidence: 0.9
    };
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isAppropriate: false,
        reason: 'Detected spam pattern',
        action: 'DELETE',
        confidence: 0.8
      };
    }
  }

  // Check for excessive caps (shouting)
  const capsCount = (content.match(/[A-Z]/g) || []).length;
  const totalLetters = (content.match(/[A-Za-z]/g) || []).length;
  if (totalLetters > 0 && capsCount / totalLetters > CAPS_THRESHOLD) {
    return {
      isAppropriate: false,
      reason: 'Excessive use of capital letters',
      action: 'WARN',
      confidence: 0.6
    };
  }

  // Check message length
  if (content.length > 1000) {
    return {
      isAppropriate: false,
      reason: 'Message too long (max 1000 characters)',
      action: 'WARN',
      confidence: 0.7
    };
  }

  // Check for empty or whitespace-only messages
  if (content.trim().length === 0) {
    return {
      isAppropriate: false,
      reason: 'Empty message',
      action: 'DELETE',
      confidence: 1.0
    };
  }

  // Message is appropriate
  return {
    isAppropriate: true,
    action: 'ALLOW',
    confidence: 1.0
  };
}

module.exports = {
  checkMessageModeration
};

