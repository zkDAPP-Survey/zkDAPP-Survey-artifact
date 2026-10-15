export default () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  issuer: process.env.ISSUER ?? 'https://zkissuer.local',
  tokenValidityHours: parseInt(process.env.TOKEN_VALIDITY_HOURS ?? '24', 10),
  ecdsaPrivateJwk: process.env.ECDSA_PRIVATE_JWK,
  ecdsaPrivateJwkPath: process.env.ECDSA_PRIVATE_JWK_PATH,
  zkPrivateKey: process.env.ZK_PRIVATE_KEY,
  zkPrivateKeyPath: process.env.ZK_PRIVATE_KEY_PATH,
  validateCredentialTypeEnabled: process.env.VALIDATE_CREDENTIAL_TYPE ?? false,
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin',
});
