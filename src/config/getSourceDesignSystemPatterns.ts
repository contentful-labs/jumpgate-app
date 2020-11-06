import catchify from 'catchify';
import { Asset, createClient, Entry } from 'contentful';
import {
  AppExtensionSDK,
  EditorExtensionSDK,
} from 'contentful-ui-extensions-sdk';

import { SOURCE_CONTENT_TYPE_ID } from '../constants';
import { DesignSystemPatternFields } from '../types';

export const getSourceDesignSystemPatterns = async (
  sdk: AppExtensionSDK,
): Promise<Entry<DesignSystemPatternFields>[]> => {
  const [getEntriesError, getEntriesResponse] = await catchify(
    sdk.space.getEntries<Entry<DesignSystemPatternFields>>({
      limit: 1000,
      content_type: SOURCE_CONTENT_TYPE_ID,
      order: 'fields.name',
    }),
  );

  if (getEntriesError !== null) {
    return [];
  }

  const { items: designSystemPatterns } = getEntriesResponse;

  return designSystemPatterns || [];
};

export const getSourceDesignSystemPattern = async (
  sdk: EditorExtensionSDK,
  entryId: string,
): Promise<Entry<DesignSystemPatternFields> | null> => {
  const [entryError, entry] = await catchify(
    sdk.space.getEntry<Entry<DesignSystemPatternFields>>(entryId),
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

export const getExternalSourceDesignSystemPatterns = async (
  spaceId: string,
  accessToken: string,
): Promise<Entry<DesignSystemPatternFields>[]> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const [getEntriesError, getEntriesResponse] = await catchify(
    client.getEntries<DesignSystemPatternFields>({
      limit: 1000,
      content_type: SOURCE_CONTENT_TYPE_ID,
      order: 'fields.name',
    }),
  );

  if (getEntriesError !== null) {
    return [];
  }

  const { items: designSystemPatterns } = getEntriesResponse;

  return designSystemPatterns || [];
};

export const getExternalSourceDesignSystemPattern = async (
  spaceId: string,
  accessToken: string,
  entryId: string,
): Promise<Entry<DesignSystemPatternFields> | null> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const [entryError, entry] = await catchify(
    client.getEntry<DesignSystemPatternFields>(entryId),
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
