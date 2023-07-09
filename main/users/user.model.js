const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        organization: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, allowNull: false },
        
        city: { type: DataTypes.STRING, allowNull: false },
        province: { type: DataTypes.STRING, allowNull: false },
        areaCode: { type: DataTypes.INTEGER, allowNull: false },
        country_id: { type: DataTypes.INTEGER, allowNull: false },
        contactNo: { type: DataTypes.INTEGER, allowNull: false },
        officeName: { type: DataTypes.STRING, allowNull: false },
        faxNo: { type: DataTypes.INTEGER, allowNull: false },
        mobileNo: { type: DataTypes.STRING, allowNull: false },
        mailingAddress: { type: DataTypes.STRING, allowNull: false },
        dob: { type: DataTypes.STRING, allowNull: false },
        gender: { type: DataTypes.STRING, allowNull: false },

        course_id: { type: DataTypes.STRING, allowNull: false },

        university_name: { type: DataTypes.STRING, allowNull: false },
        qualifying_year: { type: DataTypes.STRING, allowNull: false },


        publication_id:{ type: DataTypes.INTEGER, allowNull: true },
        award_honor_id:{ type: DataTypes.INTEGER, allowNull: true },
        achievement_in_transfusion_medicine:{ type: DataTypes.INTEGER, allowNull: true },
        membership_of_association:{ type: DataTypes.INTEGER, allowNull: true },

        membership_id:{ type: DataTypes.TEXT, allowNull: true },

        approved:{ type: DataTypes.INTEGER, allowNull: true },
        hash: { type: DataTypes.STRING, allowNull: false },
        unique_id:{ type: DataTypes.INTEGER, allowNull: false },
        uniqueToken:{ type: DataTypes.STRING, allowNull: false },
        paymentStatus:{ type: DataTypes.BOOLEAN, allowNull: false },
        user_img_id:{ type: DataTypes.INTEGER, allowNull: true }
    };

    const options = {
        defaultScope: {
            // exclude hash by default
            attributes: { exclude: ['hash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {}, }
        }
    };

    return sequelize.define('users', attributes, options);
}