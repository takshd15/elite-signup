// Security utilities
class SecurityUtils {
  static validateIP(ip) {
    if (!ip) return false;
    
    // Allow localhost and loopback addresses for testing
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('::ffff:127.0.0.1')) {
      return true;
    }
    
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Pattern.test(ip)) return true;
    
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Pattern.test(ip)) return true;
    
    return false;
  }

  static detectSuspiciousActivity(clientData) {
    const warnings = [];
    
    if (clientData.messageCount > 50) {
      warnings.push('High message frequency detected');
    }
    
    if (clientData.failedAuthAttempts > 5) {
      warnings.push('Multiple failed authentication attempts');
    }
    
    if (clientData.connectionsPerMinute > 10) {
      warnings.push('Unusual connection frequency');
    }
    
    return warnings;
  }
}

module.exports = SecurityUtils;
