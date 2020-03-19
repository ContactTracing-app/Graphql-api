const config = {
  NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
  NEO4J_USER: process.env.NEO4J_USER || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || 'letmein',
  PORT: Number(process.env.PORT) || 5000,
  DEBUG: Boolean(process.env.DEBUG || true)
};

export default config;
