import { RichTextContent } from 'contentful';

export interface AppInstallationParameters {
  spaceType: 'source' | 'consumer' | 'sourceandconsumer' | null;
  sourceSpaceId: string | null;
  sourceDeliveryToken: string | null;
  sourceConnectionValidated: boolean;
  patternMatches: Record<string, string>;
}

export interface GuidelineFields {
  name: string;
  description: string;
  content: RichTextContent;
  externalReferenceUrl: string;
}
