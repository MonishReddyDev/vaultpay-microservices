export function formatTxDescription(description, currentUserId = null) {
  if (!description) return 'Transaction';
  
  // Remove "userId: " text if present
  let formatted = description.replace(/userId:\s*/gi, '');

  // Regex to match UUIDs (e.g. 86547591-dd92-4df1-9335-546135636c97)
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  
  return formatted.replace(uuidRegex, (match) => {
    if (currentUserId && match === currentUserId) {
      return 'You';
    }
    // Return generic user string for unknown UUIDs
    return 'Another User';
  });
}
