import { generateRegistrationOptions, verifyRegistrationResponse, type VerifiedRegistrationResponse } from '@simplewebauthn/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

import { rpName, rpID, origin } from './constants';
import {
  getUserFromDB,
  getUserAuthenticators,
  getUserCurrentChallenge,
  saveNewUserAuthenticatorInDB,
  setUserCurrentChallenge,
} from './db';
import type { Authenticator, UserModel } from './types';

// 1. Generate registration options https://simplewebauthn.dev/docs/packages/server#1-generate-registration-options
export const generateRegOptions = async (loggedInUserId: UserModel['id']): Promise<ReturnType<typeof generateRegistrationOptions>> => {
  // (Pseudocode) Retrieve the user from the database
  // after they've logged in
  const user: UserModel = getUserFromDB(loggedInUserId)!;
  // (Pseudocode) Retrieve any of the user's previously-
  // registered authenticators
  const userAuthenticators: Authenticator[] = getUserAuthenticators(user);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.username,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: userAuthenticators.map(authenticator => ({
      id: authenticator.credentialID,
      type: 'public-key',
      // Optional
      transports: authenticator.transports,
    })),
    // See "Guiding use of authenticators via authenticatorSelection" below
    authenticatorSelection: {
      // Defaults
      residentKey: 'preferred',
      userVerification: 'preferred',
      // Optional
      // authenticatorAttachment: 'platform',
    },
  });

  // (Pseudocode) Remember the challenge for this user
  setUserCurrentChallenge(user, options.challenge);

  return options;
}

// 2. Verify registration response https://simplewebauthn.dev/docs/packages/server#2-verify-registration-response
export const verifyRegResponse = async (loggedInUserId: UserModel['id'], body: RegistrationResponseJSON): Promise<VerifiedRegistrationResponse> => {
  // (Pseudocode) Retrieve the logged-in user
  const user: UserModel = getUserFromDB(loggedInUserId)!;
  // (Pseudocode) Get `options.challenge` that was saved above
  const expectedChallenge: string = getUserCurrentChallenge(user)!;

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  saveNewUserAuthenticator(user, verification, body.response.transports);

  return verification;
}

// 3. Post-registration responsibilities https://simplewebauthn.dev/docs/packages/server#3-post-registration-responsibilities
const saveNewUserAuthenticator = (user: UserModel, verification: VerifiedRegistrationResponse, transports: Authenticator['transports']) => {
  const { registrationInfo } = verification;
  const {
    credentialPublicKey,
    credentialID,
    counter,
    credentialDeviceType,
    credentialBackedUp,
  } = registrationInfo!;

  const newAuthenticator: Authenticator = {
    credentialID,
    credentialPublicKey,
    counter,
    credentialDeviceType,
    credentialBackedUp,
    transports,
  };

  // (Pseudocode) Save the authenticator info so that we can
  // get it by user ID later
  saveNewUserAuthenticatorInDB(user, newAuthenticator);
};
