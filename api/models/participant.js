import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Participant = sequelize.define(
  "Participant",
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "conversations",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "participants",
    timestamps: false,
    underscored: true,
  }
);

export default Participant;
