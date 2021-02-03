import catchify from 'catchify';
import { Asset, createClient, Entry } from 'contentful';
import {
  AppExtensionSDK,
  EditorExtensionSDK,
} from 'contentful-ui-extensions-sdk';

import { SOURCE_CONTENT_TYPE_ID } from '../constants';
import { GuidelineFields } from '../types';

export const getSourceGuidelines = async (
  sdk: AppExtensionSDK,
): Promise<Entry<GuidelineFields>[]> => {
  const [getEntriesError, getEntriesResponse] = await catchify(
    sdk.space.getEntries<Entry<GuidelineFields>>({
      limit: 1000,
      content_type: SOURCE_CONTENT_TYPE_ID,
      order: 'fields.name',
    }),
  );

  if (getEntriesError !== null) {
    return [];
  }

  const { items: guidelines } = getEntriesResponse;

  return guidelines || [];
};

export const getSourceGuideline = async (
  sdk: EditorExtensionSDK,
  entryId: string,
): Promise<Entry<GuidelineFields> | null> => {
  const [entryError, entry] = await catchify(
    sdk.space.getEntry<Entry<GuidelineFields>>(entryId),
  );

  if (entryError !== null) {
    return null;
  }

  return entry;
};

export const getSourceAsset = async (
  sdk: EditorExtensionSDK,
  assetId: string,
): Promise<Asset | null> => {
  const [assetError, asset] = await catchify(
    sdk.space.getAsset<Asset>(assetId),
  );

  if (assetError !== null) {
    return null;
  }

  return asset;
};

export const getExternalSourceGuidelines = async (
  spaceId: string,
  accessToken: string,
): Promise<Entry<GuidelineFields>[]> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const [getEntriesError, getEntriesResponse] = await catchify(
    client.getEntries<GuidelineFields>({
      limit: 1000,
      content_type: SOURCE_CONTENT_TYPE_ID,
      order: 'fields.name',
    }),
  );

  if (getEntriesError !== null) {
    return [];
  }

  const { items: guidelines } = getEntriesResponse;

  return guidelines || [];
};

export const getExternalSourceGuideline = async (
  spaceId: string,
  accessToken: string,
  entryId: string,
): Promise<Entry<GuidelineFields> | null> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const [entryError, entry] = await catchify(
    client.getEntry<GuidelineFields>(entryId),
  );

  if (entryError !== null) {
    return null;
  }

  return entry;
};

export const getExternalSourceAsset = async (
  spaceId: string,
  accessToken: string,
  assetId: string,
): Promise<Asset | null> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const [assetError, asset] = await catchify(client.getAsset(assetId));

  if (assetError !== null) {
    return null;
  }

  return asset;
};
