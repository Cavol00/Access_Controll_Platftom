function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variabile d'ambiente mancante: ${name}. Copiate .env.example in .env e valorizzatela.`
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: required("DB_PATH"),
};

