import { generateAuthenticationOptions, verifyAuthenticationResponse, type VerifiedAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';

import {
  getUserAuthenticator,
  getUserAuthenticators,
  getUserCurrentChallenge,
  getUserFromDB,
  saveUpdatedAuthenticatorCounter,
  setUserCurrentChallenge,
} from './db';
import { rpID } from './constants';
import type { Authenticator, UserModel } from './types';

// 1. Generate authentication options https://simplewebauthn.dev/docs/packages/server#1-generate-authentication-options
export const generateAuthOptions = async (loggedInUserId: UserModel['id']) => {
  // (Pseudocode) Retrieve the logged-in user
  const user: UserModel = getUserFromDB(loggedInUserId)!;
  // (Pseudocode) Retrieve any of the user's previously-
  // registered authenticators
  const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

  const options = await generateAuthenticationOptions({
    rpID,
    // Require users to use a previously-registered authenticator
    allowCredentials: userAuthenticators.map(authenticator => ({
      id: authenticator.credentialID,
      type: 'public-key',
      transports: authenticator.transports,
    })),
    userVerification: 'preferred',
  });

  // (Pseudocode) Remember this challenge for this user
  setUserCurrentChallenge(user, options.challenge);

  return options;
}

// 2. Verify authentication response https://simplewebauthn.dev/docs/packages/server#2-verify-authentication-response
export const verifyAuthResponse = async (loggedInUserId: UserModel['id'], response: AuthenticationResponseJSON) => {
  // (Pseudocode) Retrieve the logged-in user
  const user: UserModel = getUserFromDB(loggedInUserId)!;
  // (Pseudocode) Get `options.challenge` that was saved above
  const expectedChallenge: string = getUserCurrentChallenge(user)!;
  // (Pseudocode} Retrieve an authenticator from the DB that
  // should match the `id` in the returned credential
  const authenticator = getUserAuthenticator(user, response.id as unknown as Authenticator['credentialID']);
  if (!authenticator) {
    throw new Error(`Could not find authenticator ${response.id} for user ${user.id}`);
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator,
  });

  saveUpdatedAuthenticator(user, authenticator, verification);

  return verification
}

// 3. Post-authentication responsibilities https://simplewebauthn.dev/docs/packages/server#3-post-authentication-responsibilities
const saveUpdatedAuthenticator = (user: UserModel, authenticator: Authenticator, verification: VerifiedAuthenticationResponse) => {
  const { authenticationInfo } = verification;
  const { newCounter } = authenticationInfo;

  saveUpdatedAuthenticatorCounter(user, authenticator, newCounter);
}
