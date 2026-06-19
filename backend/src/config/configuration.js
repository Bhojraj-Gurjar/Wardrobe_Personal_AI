export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  qdrant: {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collection: process.env.QDRANT_COLLECTION || 'products',
    vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE, 10) || 128,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  face: {
    collection: process.env.QDRANT_FACE_COLLECTION || 'users_face_vectors',
    vectorSize: parseInt(process.env.FACE_VECTOR_SIZE, 10) || 512,
    similarityThreshold:
      parseFloat(process.env.FACE_SIMILARITY_THRESHOLD) || 0.85,
  },
});
