import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.PG_DATABASE,
  process.env.PG_USER,
  process.env.PG_PASSWORD,
  {
    host: process.env.PG_HOST,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database Connected");
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await sequelize.close();
    console.log("🔻 Database Connection Closed");
  } catch (error) {
    console.error("⚠️ Error closing database connection:", error);
  }
};

export default sequelize;
export { connectDB, disconnectDB };
