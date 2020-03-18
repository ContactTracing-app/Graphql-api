const config = {
  MONGO_PATH: process.env.MONGO_PATH || 'localhost:27017',
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || 'superherodb',
  PORT: Number(process.env.PORT) || 5000
};

export default config;
