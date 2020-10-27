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
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      required: true,
      type: 'Symbol',
    },
    {
      id: 'previewImage',
      name: 'Preview Image',
      required: false,
      type: 'Link',
      linkType: 'Asset',
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
