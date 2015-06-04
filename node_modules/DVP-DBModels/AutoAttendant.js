/**
 * Created by a on 6/4/2015.
 */


module.exports = function(sequelize, DataTypes) {
    var AutoAttendant = sequelize.define('CSDB_AutoAttendant', {
            Name: {type : DataTypes.STRING, unique: true},
            Code: DataTypes.STRING,
            DayGreeting: DataTypes.STRING,
            NightGreeting: DataTypes.STRING,
            Menu: DataTypes.STRING,
            LoopCount: DataTypes.INTEGER,
            TimeOut: DataTypes.INTEGER,
            EnableExtention: DataTypes.BOOLEAN,
            Company: DataTypes.INTEGER,
            Tenant: DataTypes.INTEGER
        }
    );


    return AutoAttendant;
};
