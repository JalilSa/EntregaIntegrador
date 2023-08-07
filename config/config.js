import dotenv from '../.env';

dotenv.config();

export default {
  dbUrl: process.env.DB_URL,
  secretKey: process.env.SECRET_KEY,
  port: process.env.PORT || 3000,
};
