import { RichTextContent } from 'contentful';

export interface AppInstallationParameters {
  spaceType: 'source' | 'consumer' | 'sourceandconsumer' | null;
  sourceSpaceId: string | null;
  sourceDeliveryToken: string | null;
  sourceConnectionValidated: boolean;
  patternMatches: Record<string, string>;
}

export interface DesignSystemPatternFields {
  name: string;
  description: string;
  contentGuidelines: RichTextContent;
  iframePreviewUrl: string;
}
