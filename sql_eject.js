const sql = require('mssql');
require('dotenv').config();

const settings = require('./configuration');
//const telegram_bot = require('../../routes/api/v1/general/services/service_telegram_bot')

const tipoMSSQL = {
    'varchar': sql.VarChar,
    'nvarchar': sql.NVarChar,
    'int': sql.Int,
    'char': sql.Char,
    'datetime': sql.DateTime,
    'numeric': sql.Numeric,
    'decimal': sql.Decimal,
    'smallint': sql.SmallInt
};

const config = settings.getDatabaseConfig();

sql.on('error', err => {
    console.error('Error de SQL global:', err);
});

class SqlEject {

    async store_eject(sp_name, params, database) {
        const login_id = 1;
        const valores = {};
        const localConfig = { ...config, database };
        
        const pool = new sql.ConnectionPool(localConfig);
        const poolConnect = pool.connect();
        
        return poolConnect
            .then(async () => {
            const request = pool.request();
        
            const query = `
                SELECT 
                    p.name AS PARAMETER_NAME,
                    t.name AS DATA_TYPE,
                    p.precision AS NUMERIC_PRECISION,
                    p.scale AS NUMERIC_SCALE,
                    p.max_length AS CHARACTER_MAXIMUM_LENGTH
                FROM sys.parameters p
                JOIN sys.types t ON p.system_type_id = t.system_type_id AND p.user_type_id = t.user_type_id
                WHERE object_id = OBJECT_ID(@procedimientoAlmacenado)
                ORDER BY parameter_id;
            `;
        
            const sp_schema_result = await request
                .input('procedimientoAlmacenado', sql.NVarChar, sp_name)
                .query(query);
        
            const proc_params = sp_schema_result.recordset;
        
            // Plantilla de valores
            for (const param of proc_params) {
                const tipo = param.DATA_TYPE;
                const columna = param.PARAMETER_NAME.replace('@', '');
                const precision = param.NUMERIC_PRECISION;
                const scale = param.NUMERIC_SCALE;

                if (['usuario_alta', 'usuario_mod'].includes(columna)) {
                    valores[columna] = { value: login_id, type: tipo, precision, scale };
                    continue;
                }

                if (tipo === 'datetime') {
                    valores[columna] = {
                        value: ['fecha_alta', 'fecha_mod'].includes(columna)
                        ? new Date()
                        : '1900-01-01 00:00:00',
                        type: tipo, precision, scale
                    };
                    continue;
                }

                if (tipo === 'decimal' || tipo === 'numeric') {
                    valores[columna] = { value: 0, type: tipo, precision, scale };
                    continue;
                }

                if (tipo === 'int') {
                    valores[columna] = { value: 0, type: tipo, precision, scale };
                    continue;
                }

                valores[columna] = { value: null, type: tipo, precision, scale };
            }
        
            // Asignar valores recibidos
            Object.keys(params).forEach(k => {
                if (valores[k]) valores[k].value = params[k];
            });
        
            const sp_request = pool.request();
        
            Object.keys(valores).forEach(k => {
                const v = valores[k];
                if (!v) {
                console.warn(`Parámetro ${k} indefinido`);
                return;
                }
                const mssqlType = (v.type === 'decimal' || v.type === 'numeric')
                    ? sql.Decimal(v.precision || 18, v.scale || 0)
                    : tipoMSSQL[v.type];
                sp_request.input(k, mssqlType, v.value);
            });
        
            const result = await sp_request.execute(sp_name);
            return result.recordset;
        })
        .catch(err => {
            console.error('Error en store_eject:', err);
            /* telegram_bot.sendError( err,
                context = 'Error al subir video'
            ); */
            return null;
        })
        .finally(() => {
            pool.close(); // ✅ Cierra sólo este pool, no el global
        });
    }


    async store_eject_old(sp_name, params, database) {
        // cambiar este valor por el devuelto por la función de login
        const login_id = 1;

        const valores = {};
        config.database = database;

        try {

            let pool = await sql.connect(config);
            const request = pool.request();

            /// Obteniendo parámetros del Procedimiento almacenado
            const query = `
                select
                    PARAMETER_NAME,
                    DATA_TYPE
                from
                    information_schema.parameters
                where
                    specific_name= @procedimientoAlmacenado;
            `;

            const sp_schema_result = await request
                .input('procedimientoAlmacenado', sql.NVarChar, sp_name)
                .query(query);

            const proc_params = sp_schema_result.recordset

            /// Estableciendo valores a null y tipos en el arreglo valores como plantilla de parámetros
            for(let i = 0; i < proc_params.length; i++) {
                const tipo = proc_params[i]['DATA_TYPE'];
                const columna = proc_params[i]['PARAMETER_NAME'].replace('@', '');

                if(columna == 'usuario_alta' || columna == 'usuario_mod') {
                    valores[columna] = {value: login_id, type: tipo};
                    continue;
                }
                else
                if(tipo === 'datetime') {
                    if(columna == 'fecha_alta' || columna == 'fecha_mod')
                        valores[columna] = {value: new Date(), type: tipo};
                    else
                        valores[columna] = {value: '1900-01-01 00:00:00', type: tipo};

                    continue;
                }
                else
                if(tipo === 'datetime') {
                    valores[columna] = {value: new Date(), type: tipo};
                    continue;
                }
                else
                if(tipo === 'int') {
                    valores[columna] = {value: 0, type: tipo};
                    continue;
                }
                
                valores[columna] = {value: null, type: tipo};
            }
            

            /// Estableciendo valores en la plantilla de parámetros
            const params_keys = Object.keys(params);
            for(let i = 0; i < params_keys.length; i++ ) {
                valores[params_keys[i]].value = params[params_keys[i]];
            }
            
            const sp_request = pool.request();
            
            /// Añadiendo los parametros ya procesados al query
            const valores_keys = Object.keys(valores);
            for( let i = 0; i < valores_keys.length; i++ ) {
                if (!valores[valores_keys[i]]) {
                    console.warn(`Parámetro ${valores[valores_keys[i]].value} está indefinido`);
                }
                //console.log('tipo:', valores[valores_keys[i]].type)
                sp_request.input( `${valores_keys[i]}`, tipoMSSQL[valores[valores_keys[i]].type], `${valores[valores_keys[i]].value}`);
            }
            

            /// Ejecutando el procedimiento almacenado
            const result = await sp_request.execute(sp_name);
    
            return result.recordset;

        } catch (err) {

            console.error('Error:', err);

        } finally {

            sql.close(); // Cierra la conexión

        }
    }
}

module.exports = new SqlEject();