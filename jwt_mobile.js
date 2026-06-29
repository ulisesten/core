const jwt = require("jsonwebtoken");
const encrypt = require("./encrypt.js");
const settings = require("./configuration");
//const crypto = require("crypto");

const MOBILE_SESSION_TYPE = 2;

class JsonWebTokenMobile {
  secret_key = settings.getSecretKey();

  write_gost_token(req, dao) {
    const credentials = dao;

    const fecha_exp = new Date().getTime() + ((settings.ACCESS_TOKEN_EXPIRATION_MINUTES || 15) * 60000);

    const payload = {
      id: credentials.usu_id,
      init: new Date().getTime(),
      exp: fecha_exp,
      session_type: MOBILE_SESSION_TYPE,
      user: {
        usu_id: credentials.usu_id,
        usu_nombre: credentials.usu_nombre,
        usu_correo: credentials.usu_correo,
        usu_salt: credentials.usu_salt
      },
      sign: encrypt.hash(this.secret_key + credentials.usu_id)
    };

    return encrypt.reversible_encrypt(payload);
  }

  gost_verify(token) {
    const today = new Date().getTime();
    let decrypted_data = encrypt.decrypt(token);
    
    const decoded_data = JSON.parse(decrypted_data);
    const expected_sign = encrypt.hash(this.secret_key + decoded_data.id);
    //console.log(decoded_data)
    //console.log(expected_sign === decoded_data.sign, today > decoded_data.exp, decoded_data.session_type == MOBILE_SESSION_TYPE)

    if (decoded_data.sign !== expected_sign) return false;
    if (today > decoded_data.exp) return false;
    if (decoded_data.session_type != MOBILE_SESSION_TYPE) return false;

    return decoded_data;
  }

  write_refresh_token(req, data) {
    const fecha_exp = new Date().getTime() + ((settings.REFRESH_TOKEN_EXPIRATION_DAYS || 7) * 86400000);
    const payload = {
      id: data.usu_id,
      exp: fecha_exp,
      type: 'refresh',
      session_type: MOBILE_SESSION_TYPE,
      user: {
        usu_id: data.usu_id,
        usu_nombre: data.usu_nombre,
        usu_correo: data.usu_correo,
        usu_salt: data.usu_salt
      },
      sign: encrypt.hash(this.secret_key + data.usu_id + 'refresh')
    };

    return encrypt.reversible_encrypt(payload);
  }

  verify_refresh_token(token) {
    const today = new Date().getTime();
    let decrypted_data = encrypt.decrypt(token);
    const decoded_data = JSON.parse(decrypted_data);

    const expected_sign = encrypt.hash(this.secret_key + decoded_data.id + 'refresh');

    if (decoded_data.sign !== expected_sign) return false;
    if (today > decoded_data.exp) return false;
    if (decoded_data.session_type != MOBILE_SESSION_TYPE) return false;

    return decoded_data;
  }

  gost_hash_verify(password, hash) {
    const new_hash = encrypt.hash(password);

    if (hash.length != new_hash.length) return false;

    let i = 0;
    while (i < new_hash.length && hash[i] == new_hash[i]) {
      i += 1;
    }

    if (i != new_hash.length) return false;

    return true;
  }
}

module.exports = new JsonWebTokenMobile();
