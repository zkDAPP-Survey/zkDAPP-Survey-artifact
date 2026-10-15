import 'react-native-get-random-values';
import { hexlify } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
import { Wallet } from '@ethersproject/wallet';
import * as SecureStore from 'expo-secure-store';

import { SURVEY_MANAGER_CONTRACT_ADDRESS } from '@/config/contracts';

const DEVICE_WALLET_PRIVATE_KEY_STORAGE_KEY = 'vocdoni.deviceWallet.privateKey';

const canUseBrowserStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readStoredPrivateKey = async (): Promise<string | null> => {
  const useBrowserStorage = canUseBrowserStorage();
  console.log('[device-wallet] readStoredPrivateKey:start', {
    storage: useBrowserStorage ? 'localStorage' : 'SecureStore',
  });

  if (canUseBrowserStorage()) {
    const storedPrivateKey = window.localStorage.getItem(DEVICE_WALLET_PRIVATE_KEY_STORAGE_KEY);
    console.log('[device-wallet] readStoredPrivateKey:success', {
      storage: 'localStorage',
      found: Boolean(storedPrivateKey),
    });
    return storedPrivateKey;
  }

  const storedPrivateKey = await SecureStore.getItemAsync(DEVICE_WALLET_PRIVATE_KEY_STORAGE_KEY);
  console.log('[device-wallet] readStoredPrivateKey:success', {
    storage: 'SecureStore',
    found: Boolean(storedPrivateKey),
  });
  return storedPrivateKey;
};

const persistPrivateKey = async (privateKey: string): Promise<void> => {
  const useBrowserStorage = canUseBrowserStorage();
  console.log('[device-wallet] persistPrivateKey:start', {
    storage: useBrowserStorage ? 'localStorage' : 'SecureStore',
    hasPrivateKey: Boolean(privateKey),
  });

  if (canUseBrowserStorage()) {
    window.localStorage.setItem(DEVICE_WALLET_PRIVATE_KEY_STORAGE_KEY, privateKey);
    console.log('[device-wallet] persistPrivateKey:success', {
      storage: 'localStorage',
    });
    return;
  }

  await SecureStore.setItemAsync(DEVICE_WALLET_PRIVATE_KEY_STORAGE_KEY, privateKey);
  console.log('[device-wallet] persistPrivateKey:success', {
    storage: 'SecureStore',
  });
};

const createAndPersistDeviceWallet = async (): Promise<Wallet> => {
  console.log('[device-wallet] createAndPersistDeviceWallet:start');
  const wallet = Wallet.createRandom();

  console.log('[device-wallet] createAndPersistDeviceWallet:newWalletCreated', {
    address: wallet.address,
  });

  await persistPrivateKey(wallet.privateKey);

  console.log('[device-wallet] createAndPersistDeviceWallet:success', {
    address: wallet.address,
  });

  return wallet;
};

export const getOrCreateDeviceWallet = async (): Promise<Wallet> => {
  console.log('[device-wallet] getOrCreateDeviceWallet:start');

  try {
    const storedPrivateKey = await readStoredPrivateKey();

    if (storedPrivateKey) {
      console.log('[device-wallet] getOrCreateDeviceWallet:usingStoredKey');
      const wallet = new Wallet(storedPrivateKey);
      console.log('[device-wallet] getOrCreateDeviceWallet:success', {
        address: wallet.address,
        source: 'stored',
      });
      return wallet;
    }

    console.log('[device-wallet] getOrCreateDeviceWallet:creatingNewWallet');
    const wallet = await createAndPersistDeviceWallet();
    console.log('[device-wallet] getOrCreateDeviceWallet:success', {
      address: wallet.address,
      source: 'created',
    });
    return wallet;
  } catch (error) {
    console.error('[device-wallet] getOrCreateDeviceWallet:error', error);
    throw error;
  }
};

export const formatWalletAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const VOTER_WALLET_DOMAIN = 'zkdapp-survey-voter-v1';

/**
 * Wallet that registers and votes in one survey. Derived from the device key, so nothing extra is stored,
 * but without that key the voter addresses of different surveys (or contract deployments) cannot be linked
 * to each other or to the device wallet. It never holds ETH: registrations are submitted by the relayer
 * and Vocdoni votes are free, so there is no funding transaction pointing back to the user either.
 */
export const getVoterWalletForElection = async (electionId: number): Promise<Wallet> => {
  const deviceWallet = await getOrCreateDeviceWallet();
  const seed = [
    deviceWallet.privateKey.replace(/^0x/, ''),
    hexlify(toUtf8Bytes(VOTER_WALLET_DOMAIN)).replace(/^0x/, ''),
    SURVEY_MANAGER_CONTRACT_ADDRESS.toLowerCase().replace(/^0x/, ''),
    BigInt(electionId).toString(16).padStart(64, '0'),
  ].join('');
  return new Wallet(keccak256(`0x${seed}`));
};
