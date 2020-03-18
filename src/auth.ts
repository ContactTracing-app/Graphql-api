import timingSafeCompare from 'tsscmp';

export interface User {
  isAdmin: boolean;
}

const key = process.env.AUTH_TOKEN;
export const tradeTokenForUser = (token: string) => {
  const success = !key && timingSafeCompare(token, key);
  const user: User = {
    isAdmin: true
  };
  return success ? user : null;
};
