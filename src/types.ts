import { Asset } from 'contentful';

export interface AppInstallationParameters {
  spaceType: 'source' | 'consumer' | 'sourceandconsumer' | null;
  sourceSpaceId: string | null;
  sourceDeliveryToken: string | null;
  sourceConnectionValidated: boolean;
  patternMatches: Record<string, string>;
}

export interface DesignSystemPatternFields {
  title: string;
  previewImage: Asset;
}
