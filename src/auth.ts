import * as admin from 'firebase-admin';
import timingSafeCompare from 'tsscmp';

export interface User {
  displayName: string;
  email: string;
  isAdmin: boolean;
  photoURL?: string;
  uid: string;
}

const sessionToken = process.env.AUTH_TOKEN || '';
export const tradeTokenForUser = async (authToken: string) => {
  let user: User;

  const isAdmin = timingSafeCompare(sessionToken, authToken);

  if (isAdmin) {
    user = {
      isAdmin: true,
      uid: 'admin',
      displayName: 'admin',
      email: 'contacttracing.app@gmail.com'
    };
    return user;
  }

  try {
    const { uid, displayName, email } = await admin
      .auth()
      .verifyIdToken(authToken);

    user = {
      isAdmin: false,
      uid,
      displayName: displayName || email,
      email
    };

    return user;
  } catch (e) {
    return null;
  }
};
