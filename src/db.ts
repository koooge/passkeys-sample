import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';

import type { Authenticator, UserModel } from './types';

const users: Record<string, UserModel> = {
  'some-id-1': { id: 'some-id-1', username: 'some-username-1' },
  'some-id-2': { id: 'some-id-2', username: 'some-username-2' },
  'some-id-3': { id: 'some-id-3', username: 'some-username-3' },
};

const userAuthenticators: Record<UserModel['id'], Authenticator[]> = {};

export const getUserFromDB = (userId: UserModel['id']): UserModel | undefined => {
  return users[userId];
};

export const saveNewUserAuthenticatorInDB = (user: UserModel, authenticator: Authenticator): void => {
  if (!userAuthenticators[user.id]) throw new Error(`The user not found. id=${user.id}`);
  userAuthenticators[user.id].push(authenticator);
};

export const getUserAuthenticator = (user: UserModel, credentialId: Authenticator['credentialID']): Authenticator | undefined => {
  return userAuthenticators[user.id]?.find((a) => a.credentialID = credentialId);
};

export const getUserAuthenticators = (user: UserModel): Authenticator[] => {
  return userAuthenticators[user.id] ?? [];
};

export const saveUpdatedAuthenticatorCounter = (user: UserModel, authenticator: Authenticator, newCounter: Authenticator['counter']) => {
  if (!userAuthenticators[user.id]) throw new Error(`The user not found. id=${user.id}`)
  userAuthenticators[user.id] = userAuthenticators[user.id].map((a) => {
    if (a.credentialID !== authenticator.credentialID) return a;
    return {
      ...a,
      counter: newCounter,
    };
  });
};

export const setUserCurrentChallenge = (user: UserModel, challenge: PublicKeyCredentialCreationOptionsJSON['challenge']): void => {
  if (!users[user.id]) throw new Error(`The user not found. id=${user.id}`);
  users[user.id].currentChallenge = challenge;
};

export const getUserCurrentChallenge = (user: UserModel): string | undefined => {
  return users[user.id]?.currentChallenge;
};
