import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';

import { SOURCE_CONTENT_TYPE_ID, SOURCE_CONTENT_TYPE_NAME } from '../constants';

interface CreateDesignSystemPatternContentTypeInputInterface {
  sdk: AppExtensionSDK;
}

const contentType = {
  sys: {
    id: SOURCE_CONTENT_TYPE_ID,
  },
  name: SOURCE_CONTENT_TYPE_NAME,
  displayField: 'name',
  fields: [
    {
      id: 'name',
      name: 'Name',
      required: true,
      type: 'Symbol',
      validations: [
        {
          size: { max: 80 },
        },
      ],
    },
    {
      id: 'description',
      name: 'Description',
      required: false,
      type: 'Symbol',
      validations: [
        {
          size: { max: 160 },
        },
      ],
    },
    {
      id: 'contentGuidelines',
      name: 'Content guidelines',
      required: false,
      type: 'RichText',
      validations: [
        {
          nodes: {
            'embedded-entry-block': [
              { linkContentType: [SOURCE_CONTENT_TYPE_ID] },
            ],
          },
        },
        {
          enabledNodeTypes: [
            'heading-1',
            'heading-2',
            'heading-3',
            'heading-4',
            'heading-5',
            'heading-6',
            'ordered-list',
            'unordered-list',
            'hr',
            'blockquote',
            'embedded-asset-block',
            'embedded-entry-block',
          ],
          message:
            'Only heading 1, heading 2, heading 3, heading 4, heading 5, heading 6, ordered list, unordered list, horizontal rule, quote, and asset nodes are allowed',
        },
      ],
    },
    {
      id: 'iframePreviewUrl',
      name: 'iframe preview URL',
      required: false,
      type: 'Symbol',
      validations: [
        {
          regexp: {
            flags: null,
            pattern:
              '^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-/]))?$',
          },
        },
      ],
    },
  ],
};

const createDesignSystemPatternContentType = async ({
  sdk,
}: CreateDesignSystemPatternContentTypeInputInterface): Promise<void> => {
  const createdContentType = await sdk.space.createContentType(contentType);

  // Call the update to publish a content type
  await sdk.space.updateContentType(createdContentType);
};

export default createDesignSystemPatternContentType;
