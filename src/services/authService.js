const { dbPool } = require('../config/dbConnection');

const loginUser = async (email, password) => {
    try {
        const login = "SELECT users.login_user($1, $2) AS user_data";
        const { rows } = await dbPool.query(login, [email, password]);

        const user_id = rows[0].user_data;

        if (!user_id) {
            throw new Error('Credenciales inválidas o usuario no encontrado');
        }

        const userDetails = await dbPool.query(
            `SELECT u.id, u.email, u.first_name, u.middle_name, u.last_name, u.mother_last_name
             FROM users."user" u
             INNER JOIN roles.user_role ur
                 ON u.id = ur.user_id
            INNER JOIN roles."role" r
                 ON ur.role_id = r.id
             WHERE u.id = $1`,
             [user_id]
        );
        
        return userDetails.rows[0];

    } catch (error) {
        if (error.message.includes('Invalid email or password')) {
            throw error;
        }
        throw new Error('Error al iniciar sesión: ' + error.message);
    }
};

const getMyUser = async (userId) => {
    try {
        const userData = await dbPool.query(
            `SELECT
                u.id, u.first_name,
                u.middle_name,
                u.last_name,
                u.mother_last_name,
                u.email,
                i.file_path AS profile_image_url
            FROM users."user" u
            INNER JOIN files.image i
                ON u.profile_image_id = i.id
            WHERE u.id = $1`,
            [userId]
        );

        if (userData.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const user = userData.rows[0];

        const roleData = await dbPool.query(
            `SELECT r."name" AS role_name
             FROM roles.user_role ur
             INNER JOIN roles."role" r
                 ON ur.role_id = r.id
             WHERE ur.user_id = $1`,
            [userId]
        );

        user.role = roleData.rows.length > 0 ? roleData.rows[0].role_name : null;

        const abilitiesData = await dbPool.query(
            `SELECT
                m."name" as module_name,
                a."name" AS ability_code,
                a."label" as ability_name
             FROM roles.user_role ur
             INNER JOIN roles.role_ability ra
                 ON ur.role_id = ra.role_id
             INNER JOIN roles.ability a
                 ON ra.ability_id = a.id
             INNER JOIN roles."module" m
                ON a.module_id = m.id
             WHERE ur.user_id = $1
             AND ra."granted" = true
             ORDER BY m.id, a.id`,
            [userId]
        );

        user.abilities = abilitiesData.rows.map(row => row.ability_name);

        return user;
    } catch (error) {
        throw new Error('Error al obtener usuario: ' + error.message);
    }
};

const registerUser = async (userData) => {
    const client = await dbPool.connect();
    try {
        await client.query("BEGIN");

        const sql = `SELECT users.register_user( $1, $2, $3, $4, $5, $6, $7, $8, $9 ) as new_user_id;`;
        const values = [
            userData.firstName,
            userData.middleName || null,
            userData.lastName,
            userData.motherLastName || null,
            userData.email,
            userData.password,
            userData.gender,
            userData.birthDate,
            userData.profileImageId || null,
        ];

        const res = await client.query(sql, values);
        const newUserId = res.rows[0].new_user_id;

        if (userData.profileImageId) {
            await imageRepository.markImageAsPermanent(userData.profileImageId);
        }

        const tokenRes = await client.query(
            'SELECT token FROM users.email_verification_token WHERE user_id = $1',
            [newUserId]
        );

        const token = tokenRes.rows[0].token;
        await client.query("COMMIT");
        return token;
    } catch (error) {
        await client.query("ROLLBACK");
        throw new Error("Error al registrar al usuario: " + error.message);
    } finally {
        client.release();
    }
}

const verifyEmail = async (token) => {
    const query = `SELECT users.verify_email($1) AS is_verified`;
    const res = await dbPool.query(query, [token]);
    return res.rows[0].success;
}

module.exports = {
    loginUser,
    getMyUser,
    registerUser,
    verifyEmail
};