export const validateJournalEntry = (req, res, next) => {
    if (!req.body.content || req.body.content.trim().length < 10) {
      return res.status(400).json({ error: 'Journal content must be at least 10 characters' });
    }
    next();
  };