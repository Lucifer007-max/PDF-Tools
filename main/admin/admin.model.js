const { DataTypes } = require('sequelize');

module.exports = {
    roles
};

function roles(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        roleName: {type: DataTypes.STRING , allowNull: false}
    }
    return sequelize.define('roles', attributes);
}