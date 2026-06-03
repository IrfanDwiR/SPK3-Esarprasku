import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";
import Kategori from "./KategoriModel.js";

const { DataTypes } = Sequelize;

const Aspirasi = db.define('aspirasi', {
    id_aspirasi: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kode_aspirasi: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    id_siswa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id_user'
        }
    },
    id_kategori: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Kategori,
            key: 'id_kategori'
        }
    },
    judul: {
        type: DataTypes.STRING,
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    lokasi: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gambar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING, // 'baru', 'diproses', 'selesai', 'ditolak'
        allowNull: false,
        defaultValue: 'baru'
    },
    tanggal_pengajuan: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
}, {
    freezeTableName: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Setup relationships
Aspirasi.belongsTo(User, { foreignKey: 'id_siswa', as: 'siswa' });
Aspirasi.belongsTo(Kategori, { foreignKey: 'id_kategori', as: 'kategoriObj' });

export default Aspirasi;