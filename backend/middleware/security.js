const xss = require('xss');
const validator = require('validator');

function sanitizeInput(req, res, next){
  if(req.body && typeof req.body === 'object'){
    for(const k in req.body){
      if(typeof req.body[k] === 'string'){
        let s = req.body[k];
        s = s.trim();
        s = xss(s);
        if(s.length > 2000) s = s.slice(0,2000);
        req.body[k] = s;
      }
    }
  }
  next();
}

module.exports = { sanitizeInput };
