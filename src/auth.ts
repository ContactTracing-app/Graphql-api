export interface User {
  isAdmin: boolean;
}

export const tradeTokenForUser = (token: string) => {
  const user: User = {
    isAdmin: true
  };
  return token === process.env.AUTH_TOKEN ? user : null;
};
