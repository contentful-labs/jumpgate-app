import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';

import { SOURCE_CONTENT_TYPE_ID, SOURCE_CONTENT_TYPE_NAME } from '../constants';

interface CreateGuidelineContentTypeInputInterface {
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
      name: 'Short description',
      required: false,
      type: 'Symbol',
      validations: [
        {
          size: { max: 160 },
        },
      ],
    },
    {
      id: 'content',
      name: 'Content',
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
      id: 'externalReferenceUrl',
      name: 'External reference (URL)',
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

const createGuidelineContentType = async ({
  sdk,
}: CreateGuidelineContentTypeInputInterface): Promise<void> => {
  const createdContentType = await sdk.space.createContentType(contentType);

  // Call the update to publish a content type
  await sdk.space.updateContentType(createdContentType);
};

export default createGuidelineContentType;
