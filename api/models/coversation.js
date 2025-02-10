import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Conversation = sequelize.define(
  "Conversation",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    is_group: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "conversations",
    timestamps: true,
    underscored: true,
  }
);

export default Conversation;
