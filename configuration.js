require('dotenv').config();
const path = require('path');

class BaseConfig {
    DB_USER = process.env.DB_USER
    DB_PASSWORD = process.env.DB_PASSWORD
    DB_SERVER = process.env.DB_SERVER
    DB_DATABASE = process.env.DB_DATABASE
    DB_ENCRYPT = true
    DB_TRUST_CERTIFICATE = true
}

class Settings extends BaseConfig {
    PORT = process.env.SERVER_PORT;
    PROJECTDIR = path.join(__dirname, '../../../../');
    BACKEND_CORS_ORIGINS = process.env.BACKEND_CORS_ORIGINS
    SERVER_HOST = process.env.SERVER_HOST
    SERVER_PORT = process.env.SERVER_PORT
    SECRET_KEY = process.env.SECRET_KEY
    API_NAS = process.env.API_NAS
    PUBLIC_ID_LENGTH = process.env.PUBLIC_ID_LENGTH
    DOMAIN_NAME = process.env.DOMAIN_NAME;
    VIDEO_OUTPUT_PATH;
    TEMP_VIDEOS_PATH;
    BACKEND_CORS_ORIGINS = process.env.BACKEND_CORS_ORIGINS;
    REDIRECT_HTTP_TO_HTTPS = process.env.REDIRECT_HTTP_TO_HTTPS === 'true';
    API_NAS_RELATIVE = process.env.API_NAS_RELATIVE
    NODE_ENV = process.env.NODE_ENV || 'production';

    REFRESH_TOKEN_EXPIRATION_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS) || 7;
    ACCESS_TOKEN_EXPIRATION_MINUTES = Number(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES) || 15;
    
    CORREO_SECRET_KEY = process.env.CORREO_SECRET_KEY;
    CORREO_HOST = process.env.CORREO_HOST;
    CORREO_PORT = process.env.CORREO_PORT;
    CORREO_USER = process.env.CORREO_USER;
    CORREO_PASS = process.env.CORREO_PASS;

    X_VECTOR = process.env.X_VECTOR || '';

    constructor() {
        super();
        //this.VIDEO_OUTPUT_PATH = path.join(this.PROJECTDIR, process.env.VIDEO_OUTPUT_PATH);
        //this.TEMP_VIDEOS_PATH = path.join(this.PROJECTDIR, process.env.TEMP_VIDEOS_PATH);
    }

    getDatabaseConfig() {
        return {
            user: this.DB_USER,
            password: this.DB_PASSWORD,
            server: this.DB_SERVER,
            database: this.DB_DATABASE,
            options: {
                encrypt: process.env.DB_ENCRYPT === 'false',
                trustServerCertificate: process.env.DB_TRUST_CERTIFICATE === 'false'
            }

        }
    }

    getSecretKey() {
        return this.SECRET_KEY;
    }

    getCredentials() {
        return {
            usu_id: process.env.USU_ID,
            usu_correo: process.env.USU_CORREO,
            usu_nombre: process.env.USU_NOMBRE
        }
    }

    getExpirationDays() {
        return process.env.REFRESH_TOKEN_EXPIRATION_DAYS;
    }

    getCors() {
        if (!this.BACKEND_CORS_ORIGINS) {
            return [];
        }

        return this.BACKEND_CORS_ORIGINS
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }

    getApiNAS() {
        return this.API_NAS;
    }

    getPublicIdLength() {
        return this.PUBLIC_ID_LENGTH;
    }

    getCorreoConfig() {
        return {
            host: this.CORREO_HOST,
            port: Number(this.CORREO_PORT),
            secure: Number(this.CORREO_PORT) === 465,
            auth: {
                user: this.CORREO_USER,
                pass: this.CORREO_PASS
            },
            requireTLS: false,
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000
        };
    }

    getXVector(){
        return this.X_VECTOR.split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }
}

module.exports = new Settings();
