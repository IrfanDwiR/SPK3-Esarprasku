import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const { DataTypes } = Sequelize;

const LogAktivitas = db.define('log_aktivitas', {
    id_log: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id_user'
        }
    },
    aktivitas: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    waktu: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    freezeTableName: true,
    timestamps: false // as per the specification, it only has 'waktu' as the timestamp
});

LogAktivitas.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

export default LogAktivitas;
