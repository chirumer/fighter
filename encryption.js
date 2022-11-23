const crypto = require('crypto');

require('dotenv').config()

exports.encrypt = (text) => {
  const algorithm = 'aes-256-ctr';
  const IV_LENGTH = 16;

  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

exports.decrypt = (text) => {
  const algorithm = 'aes-256-ctr';

  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(process.env.ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

function access_code(email) {
  const hash = crypto.createHash('md5').update(email + process.env.ENCRYPTION_KEY).digest('hex').toLowerCase();
  return hash.substring(0, 9)
};

exports.access_code = access_code;

exports.valid_access_code = (email, user_code) => {
  return user_code == exports.access_code(email);
};