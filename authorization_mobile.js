const jwt = require("./jwt.js");
const settings = require("./configuration.js");

const SESSION_TYPE_MOBILE = 2;

class AuthorizationMobileService {

    verify(req, res, next) {
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

        if (auth.user.session_type !== SESSION_TYPE_MOBILE) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'Invalid session type.',
                status: 401
            });
            res.end();
            return;
        }

        req.user = auth.user;
        req.authorized = true;

        next();
    }

    user_signin(req, res, dao) {
        const password = req.body['usu_contrasena'];

        if (!dao || !dao[0])
            return null;

        dao = dao[0];
        const hash = dao["usu_contrasena"];

        if (!jwt.gost_hash_verify(password, hash)) {
            return null;
        }

        const user_data = {
            usu_id: dao["usu_id"],
            usu_nombre: dao["usu_nombre"],
            usu_correo: dao["usu_correo"],
            session_type: SESSION_TYPE_MOBILE
        };

        const access_token = jwt.write_gost_token(req, user_data);
        const refresh_token = jwt.write_refresh_token(req, user_data);

        return {
            access_token,
            refresh_token,
            usu_id: dao["usu_id"],
            usu_nombre: dao["usu_nombre"],
            usu_correo: dao["usu_correo"],
            session_type: SESSION_TYPE_MOBILE
        };
    }

    refresh(req, res, next) {
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

        if (auth.user.session_type !== SESSION_TYPE_MOBILE) {
            res.status(401).json({
                success: false,
                error: 1,
                msg: 'Invalid session type.'
            });
            return;
        }

        req.user = auth.user;
        req.authorized = true;

        const user = {
            usu_id: auth.user.usu_id,
            usu_nombre: auth.user.usu_nombre,
            usu_correo: auth.user.usu_correo,
            session_type: SESSION_TYPE_MOBILE
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