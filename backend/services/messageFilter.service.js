// backend/services/messageFilter.service.js
// Message filtering service to prevent platform bypass by blocking contact information

class MessageFilterService {
    constructor() {
        // Regex patterns for contact information detection
        this.patterns = {
            // Phone numbers (various formats)
            phone: [
                /\b\d{10,}\b/g, // 10+ consecutive digits
                /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // XXX-XXX-XXXX, XXX.XXX.XXXX, XXX XXX XXXX
                /\b\+\d{1,3}[\s-]?\d{7,15}\b/g, // International format +XX XXXXXXXXXX
                /\b\d{5}[\s-]?\d{5}\b/g, // XXXXX XXXXX (Indian format)
                /\(\d{3}\)[\s-]?\d{3}[-.\s]?\d{4}/g, // (XXX) XXX-XXXX
                /\d{3,4}[-.\s]\d{3,4}[-.\s]\d{3,4}/g // XXX-XXX-XXX or XXXX-XXXX-XXXX
            ],

            // Email addresses
            email: [
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                /\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b/g, // With spaces
                /\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\[\s*dot\s*\]\s*[A-Z|a-z]{2,}\b/gi, // Obfuscated [at] [dot]
                /\b[A-Za-z0-9._%+-]+\s*\(\s*at\s*\)\s*[A-Za-z0-9.-]+\s*\(\s*dot\s*\)\s*[A-Z|a-z]{2,}\b/gi // Obfuscated (at) (dot)
            ],

            // URLs and domains
            url: [
                /https?:\/\/[^\s]+/gi,
                /www\.[^\s]+/gi,
                /\b[a-z0-9-]+\.(com|net|org|io|co|in|uk|us|me|biz|info|xyz)\b/gi,
                /\b[a-z0-9-]+\s*\.\s*(com|net|org|io|co|in|uk|us|me|biz|info|xyz)\b/gi // With spaces
            ],

            // Social media handles
            socialHandles: [
                /@[a-zA-Z0-9_]{3,}/g, // @username
                /instagram\.com\/[a-zA-Z0-9._-]+/gi,
                /facebook\.com\/[a-zA-Z0-9._-]+/gi,
                /twitter\.com\/[a-zA-Z0-9_]+/gi,
                /t\.me\/[a-zA-Z0-9_]+/gi,
                /wa\.me\/\d+/gi,
                /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi,
                /youtube\.com\/@?[a-zA-Z0-9_-]+/gi,
                /tiktok\.com\/@[a-zA-Z0-9_.]+/gi
            ],

            // Messaging apps
            messagingApps: [
                /\bwhatsapp\b/gi,
                /\bwhats\s*app\b/gi,
                /\bwa\b/gi, // Short for WhatsApp
                /\btelegram\b/gi,
                /\bsignal\b/gi,
                /\bviber\b/gi,
                /\bwechat\b/gi,
                /\bskype\b/gi,
                /\bdiscord\b/gi,
                /\bslack\b/gi,
                /\bmessenger\b/gi,
                /\bsnapchat\b/gi,
                /\binsta\s*dm\b/gi
            ]
        };

        // Keywords that suggest contact sharing intent
        this.keywords = [
            'call me', 'text me', 'dm me', 'message me',
            'my number', 'phone number', 'contact number',
            'email me', 'send email', 'my email',
            'add me on', 'follow me on', 'find me on',
            'outside the platform', 'off platform', 'outside platform',
            'directly contact', 'personal contact', 'private message',
            'reach me at', 'contact me at', 'get in touch'
        ];
    }

    /**
     * Check if message contains restricted content
     * @param {string} message - Message content to check
     * @returns {Object} - { isViolation: boolean, reason: string, type: string }
     */
    checkMessage(message) {
        if (!message || typeof message !== 'string') {
            return { isViolation: false };
        }

        const lowerMessage = message.toLowerCase();

        // Check phone numbers
        for (const pattern of this.patterns.phone) {
            if (pattern.test(message)) {
                return {
                    isViolation: true,
                    reason: 'Phone numbers are not allowed before deal confirmation',
                    type: 'phone',
                    detectedPattern: 'phone number'
                };
            }
        }

        // Check email addresses
        for (const pattern of this.patterns.email) {
            if (pattern.test(message)) {
                return {
                    isViolation: true,
                    reason: 'Email addresses are not allowed before deal confirmation',
                    type: 'email',
                    detectedPattern: 'email address'
                };
            }
        }

        // Check URLs
        for (const pattern of this.patterns.url) {
            if (pattern.test(message)) {
                return {
                    isViolation: true,
                    reason: 'URLs are not allowed before deal confirmation',
                    type: 'url',
                    detectedPattern: 'URL/link'
                };
            }
        }

        // Check social media handles
        for (const pattern of this.patterns.socialHandles) {
            const matches = message.match(pattern);
            if (matches && matches.length > 0) {
                // Allow @mentions in context of collaboration (e.g., "I post tech reviews @myhandle")
                // But block if it's clearly asking for contact
                const context = message.substring(
                    Math.max(0, message.indexOf(matches[0]) - 20),
                    Math.min(message.length, message.indexOf(matches[0]) + matches[0].length + 20)
                ).toLowerCase();

                const contactKeywords = ['add me', 'find me', 'contact me', 'dm me', 'message me', 'follow me'];
                const hasContactIntent = contactKeywords.some(keyword => context.includes(keyword));

                if (hasContactIntent) {
                    return {
                        isViolation: true,
                        reason: 'Sharing social media handles for contact is not allowed before deal confirmation',
                        type: 'social_handle',
                        detectedPattern: 'social media handle'
                    };
                }
            }
        }

        // Check messaging app keywords
        for (const pattern of this.patterns.messagingApps) {
            if (pattern.test(message)) {
                return {
                    isViolation: true,
                    reason: 'References to external messaging apps are not allowed before deal confirmation',
                    type: 'messaging_app',
                    detectedPattern: 'messaging app'
                };
            }
        }

        // Check suspicious keywords
        for (const keyword of this.keywords) {
            if (lowerMessage.includes(keyword)) {
                return {
                    isViolation: true,
                    reason: 'Sharing contact information is not allowed before deal confirmation',
                    type: 'keyword',
                    detectedPattern: keyword
                };
            }
        }

        return { isViolation: false };
    }

    /**
     * Check for obfuscated contact info (numbers with spaces, etc.)
     * @param {string} message - Message to check
     * @returns {boolean}
     */
    checkObfuscation(message) {
        // Remove spaces and check if it forms a phone number
        const noSpaces = message.replace(/\s+/g, '');
        const hasHiddenPhone = /\d{10,}/.test(noSpaces);

        if (hasHiddenPhone) {
            // Count spaces between digits
            const digitSections = message.match(/\d[\s-]*\d/g);
            if (digitSections && digitSections.length > 3) {
                return true; // Likely obfuscated phone number
            }
        }

        return false;
    }

    /**
     * Get message limit status for a conversation
     * @param {number} messageCount - Current message count
     * @param {boolean} dealConfirmed - Whether deal is confirmed with payment
     * @returns {Object} - { allowed: boolean, remaining: number, message: string }
     */
    getMessageLimitStatus(messageCount, dealConfirmed) {
        const MESSAGE_LIMIT = 10;

        if (dealConfirmed) {
            return {
                allowed: true,
                remaining: null,
                message: 'Unlimited messages - deal confirmed'
            };
        }

        if (messageCount >= MESSAGE_LIMIT) {
            return {
                allowed: false,
                remaining: 0,
                message: 'Message limit reached. Please create a deal to continue chatting.'
            };
        }

        return {
            allowed: true,
            remaining: MESSAGE_LIMIT - messageCount,
            message: `${MESSAGE_LIMIT - messageCount} messages remaining before deal confirmation required`
        };
    }

    /**
     * Sanitize message (remove potential XSS or unwanted content)
     * @param {string} message - Message to sanitize
     * @returns {string} - Sanitized message
     */
    sanitizeMessage(message) {
        if (!message) return '';

        // Remove HTML tags
        let sanitized = message.replace(/<[^>]*>/g, '');

        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        // Limit length
        const MAX_LENGTH = 2000;
        if (sanitized.length > MAX_LENGTH) {
            sanitized = sanitized.substring(0, MAX_LENGTH);
        }

        return sanitized;
    }
}

module.exports = new MessageFilterService();
