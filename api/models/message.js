import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "conversations",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_messages_conversation_id",
        fields: ["conversation_id"],
      },
      {
        name: "idx_messages_created_at",
        fields: ["created_at"],
      },
    ],
  }
);

export default Message;
