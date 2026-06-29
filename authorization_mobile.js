const jwt = require("./jwt_mobile.js");
const settings = require("./configuration.js");
const encryptService = require('./encrypt.js');
const sqlEject = require('./sql_eject.js');

const CONS_USU_SIGNIN = 1;

class AuthorizationMobileService {

    async userDAO(prm_usu_correo) {
        const usu_correo = prm_usu_correo.trim().toLowerCase();
        const parametros = {
            tipoConsulta: CONS_USU_SIGNIN,
            usu_correo: usu_correo
        };

        return await sqlEject.store_eject("procUsersCons", parametros, "delivery_api");
    }

    async verify(req, res, next) {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'No credentials are present.',
                status: 401
            });
            res.end();
            return;
        }

        const token = authHeader.split(' ')[1];

        const auth = jwt.gost_verify(token);

        if (!auth) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'Authentication rejected.',
                status: 401
            });
            res.end();
            return;
        }

        const dao = (await this.userDAO(auth.user.usu_correo))[0];
        if (!dao || dao.length == 0) {
            return reject(res, 500, 'Error al iniciar sesión');
        }

        if (dao.usu_salt.trim() !== auth.user.usu_salt.trim()) {
            console.log('[ERROR] salt mismatch mobile', dao.usu_id);
            return reject(res, 401, 'Error al iniciar sesión');
        }

        req.user = auth.user;
        req.authorized = true;

        next();
    }

    async user_signin(req, res) {
        const password = req.body['usu_contrasena'];

        const hashed_email = encryptService.hash(req.body.usu_correo.trim().toLowerCase());
        
        const dao = (await this.userDAO(hashed_email))[0];
        if (!dao)
            return null;

        const hash = dao["usu_contrasena"];

        if (!jwt.gost_hash_verify(password, hash)) {
            return null;
        }

        const user_data = {
            usu_id: dao["usu_id"],
            usu_nombre: dao["usu_nombre"],
            usu_correo: dao["usu_correo"],
            usu_salt: dao["usu_salt"]
        };

        const access_token = jwt.write_gost_token(req, user_data);
        const refresh_token = jwt.write_refresh_token(req, user_data);

        console.log('dao', dao);
        
        return {
            access_token,
            refresh_token,
            usu_id: dao["usu_id"],
            usu_id_public: dao["usu_id_public"],
            usu_nombre: dao["usu_nombre"],
            usu_correo: req.body.usu_correo.trim()
        };
    }

    async refresh(req, res, next) {
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'No credentials are present.'
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        const auth = jwt.verify_refresh_token(token);

        if (!auth) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'Authentication rejected.'
            });
            return;
        }

        const dao = (await this.userDAO(auth.user.usu_correo))[0];
        if (!dao || dao.length == 0) {
            return reject(res, 500, 'Error al iniciar sesión');
        }

        if (dao.usu_salt.trim() !== auth.user.usu_salt.trim()) {
            console.log('[ERROR] salt mismatch mobile refresh', dao.usu_id);
            return reject(res, 401, 'Error al iniciar sesión');
        }

        req.user = auth.user;
        req.authorized = true;

        const user = {
            usu_id: auth.user.usu_id,
            usu_nombre: auth.user.usu_nombre,
            usu_correo: auth.user.usu_correo,
            usu_salt: auth.user.usu_salt
        };

        const new_access_token = jwt.write_gost_token(req, user);

        res.json({
            success: true,
            access_token: new_access_token
        });

        next();
    }
}

module.exports = new AuthorizationMobileService();