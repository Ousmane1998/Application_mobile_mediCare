// @ts-nocheck
export default function adminMiddleware(req, res, next) {
  if (!req.user || String(req.user.role) !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé (admin requis).' });
  }
  next();
}
