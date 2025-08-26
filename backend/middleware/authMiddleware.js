const jwt = require('jsonwebtoken');
module.exports = function(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader) return res.status(401).json({ message: 'Token ausente' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch(err){
    return res.status(403).json({ message: 'Token inválido' });
  }
};
