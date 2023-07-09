const db = require('_helpers/db');
const { QueryTypes } = require('sequelize');


module.exports ={
    rolecreate,
    adminGetById
};
 
async function rolecreate(params) {
    await db.admin.create(params);
}
async function adminGetById(id){
    return await getProfileId(id);
}

async function getProfileId(){
    const data = await db.sequelize.query('select * from Users where role = "admin"', {
        nest: true,
        type: QueryTypes.SELECT
    });
    if (!data) throw 'No record found';
    return data;
}