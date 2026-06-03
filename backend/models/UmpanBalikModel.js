import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";
import Aspirasi from "./AspirasiModel.js";

const { DataTypes } = Sequelize;

const UmpanBalik = db.define('umpan_balik', {
    id_umpan_balik: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_aspirasi: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Aspirasi,
            key: 'id_aspirasi'
        }
    },
    id_admin: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id_user'
        }
    },
    isi_balasan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tanggal_balasan: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    progres: {
        type: DataTypes.STRING, // e.g. '25%', '50%', '100%'
        allowNull: false
    }
}, {
    freezeTableName: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

UmpanBalik.belongsTo(Aspirasi, { foreignKey: 'id_aspirasi', as: 'aspirasi' });
UmpanBalik.belongsTo(User, { foreignKey: 'id_admin', as: 'admin' });

// Add one-to-many relationship in Aspirasi to fetch umpan balik
Aspirasi.hasMany(UmpanBalik, { foreignKey: 'id_aspirasi', as: 'umpanBalik' });

export default UmpanBalik;
