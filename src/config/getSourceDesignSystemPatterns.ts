import catchify from 'catchify';
import { createClient, Entry } from 'contentful';
import {
  AppExtensionSDK,
  EditorExtensionSDK,
} from 'contentful-ui-extensions-sdk';

import { SOURCE_CONTENT_TYPE_ID } from '../constants';
import { DesignSystemPatternFields } from '../types';

export const getSourceDesignSystemPatterns = async (
  sdk: AppExtensionSDK,
): Promise<Entry<DesignSystemPatternFields>[]> => {
  const { items: designSystemPatterns } = await sdk.space.getEntries<
    Entry<DesignSystemPatternFields>
  >({
    limit: 1000,
    content_type: SOURCE_CONTENT_TYPE_ID,
    order: 'fields.title',
  });

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

export const getExternalSourceDesignSystemPatterns = async (
  spaceId: string,
  accessToken: string,
): Promise<Entry<DesignSystemPatternFields>[]> => {
  const client = createClient({
    space: spaceId,
    accessToken,
  });

  const { items: designSystemPatterns } = await client.getEntries<
    DesignSystemPatternFields
  >({
    limit: 1000,
    content_type: SOURCE_CONTENT_TYPE_ID,
    order: 'fields.title',
  });

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
