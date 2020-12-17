import { Entry, Asset } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  EmptyState,
} from '@contentful/forma-36-react-components';
import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';

import {
  getSourceAsset,
  getSourceDesignSystemPattern,
  getExternalSourceDesignSystemPattern,
  getExternalSourceAsset,
} from '../../../config/getSourceDesignSystemPatterns';
import {
  AppInstallationParameters,
  DesignSystemPatternFields,
} from '../../../types';
import getEntryFieldValue from '../../../utils/getEntryFieldValue';
import styles from './EntryEditorScreen.module.css';

interface ConfigProps {
  sdk: EditorExtensionSDK;
}

const EntryEditor: React.FC<ConfigProps> = (props) => {
  const { sdk } = props;
  const installationParameters = sdk.parameters
    .installation as AppInstallationParameters;

  const [designSystemPattern, setDesignSystemPattern] = useState<
    Entry<DesignSystemPatternFields> | null | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      if (
        installationParameters.patternMatches[sdk.contentType.sys.id] ===
        undefined
      ) {
        setDesignSystemPattern(null);
        return;
      }

      if (installationParameters.spaceType === 'consumer') {
        setDesignSystemPattern(
          await getExternalSourceDesignSystemPattern(
            installationParameters.sourceSpaceId!,
            installationParameters.sourceDeliveryToken!,
            installationParameters.patternMatches[sdk.contentType.sys.id],
          ),
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        const internalSystemPattern = await getSourceDesignSystemPattern(
          sdk,
          installationParameters.patternMatches[sdk.contentType.sys.id],
        );

        setDesignSystemPattern(internalSystemPattern);
      }
    })();
  }, [
    installationParameters.patternMatches,
    installationParameters.sourceDeliveryToken,
    installationParameters.sourceSpaceId,
    installationParameters.spaceType,
    sdk,
    sdk.contentType.sys.id,
  ]);

  const [assets, setAssets] = useState<
    Record<string, Asset | null | undefined>
  >({});

  const loadAsset = useCallback(
    async (assetId: string): Promise<void> => {
      setAssets({
        ...assets,
        [assetId]: null,
      });

      let loadedAsset = null;

      if (installationParameters.spaceType === 'consumer') {
        loadedAsset = await getExternalSourceAsset(
          installationParameters.sourceSpaceId!,
          installationParameters.sourceDeliveryToken!,
          assetId,
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        loadedAsset = await getSourceAsset(sdk, assetId);
      }

      if (loadedAsset === null) {
        return;
      }

      setAssets({
        ...assets,
        [assetId]: loadedAsset,
      });
    },
    [
      assets,
      installationParameters.sourceDeliveryToken,
      installationParameters.sourceSpaceId,
      installationParameters.spaceType,
      sdk,
    ],
  );

  const [designSystemPatterns, setDesignSystemPatterns] = useState<
    Record<string, Entry<DesignSystemPatternFields> | null | undefined>
  >({});

  const loadDesignSystemPattern = useCallback(
    async (entryId: string): Promise<void> => {
      setDesignSystemPatterns({
        ...designSystemPatterns,
        [entryId]: null,
      });

      let loadedDesignSystemPattern = null;

      if (installationParameters.spaceType === 'consumer') {
        loadedDesignSystemPattern = await getExternalSourceDesignSystemPattern(
          installationParameters.sourceSpaceId!,
          installationParameters.sourceDeliveryToken!,
          entryId,
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        loadedDesignSystemPattern = await getSourceDesignSystemPattern(
          sdk,
          entryId,
        );
      }

      if (loadedDesignSystemPattern === null) {
        return;
      }

      setDesignSystemPatterns({
        ...designSystemPatterns,
        [entryId]: loadedDesignSystemPattern,
      });
    },
    [
      designSystemPatterns,
      installationParameters.sourceDeliveryToken,
      installationParameters.sourceSpaceId,
      installationParameters.spaceType,
      sdk,
    ],
  );

  const richTextOptions = useMemo(() => {
    const options: Options = {
      renderNode: {
        [BLOCKS.EMBEDDED_ASSET]: (node) => {
          const assetId = node.data.target.sys.id;
          const asset = assets[assetId];

          if (asset === undefined) {
            loadAsset(assetId);
            return null;
          }

          if (asset === null) {
            return null;
          }

          const file = getEntryFieldValue(
            asset.fields.file,
            asset.sys.locale || sdk.locales.default,
          );

          return (
            <figure>
              <img
                src={file.url}
                alt={getEntryFieldValue(
                  asset.fields.title,
                  asset.sys.locale || sdk.locales.default,
                )}
                width={file.details.image.width}
                height={file.details.image.height}
              />
              <figcaption>
                {getEntryFieldValue(
                  asset.fields.description,
                  asset.sys.locale || sdk.locales.default,
                )}
              </figcaption>
            </figure>
          );
        },
        [BLOCKS.EMBEDDED_ENTRY]: (node) => {
          const entryId = node.data.target.sys.id;
          const designSystemPattern = designSystemPatterns[entryId];

          if (designSystemPattern === undefined) {
            loadDesignSystemPattern(entryId);
            return null;
          }

          if (designSystemPattern === null) {
            return null;
          }

          return (
            <div className={styles.richText}>
              {documentToReactComponents(
                getEntryFieldValue(
                  designSystemPattern.fields.contentGuidelines,
                  designSystemPattern.sys.locale || sdk.locales.default,
                ),
                richTextOptions,
              )}
            </div>
          );
        },
      },
    };

    return options;
  }, [
    assets,
    loadAsset,
    designSystemPatterns,
    loadDesignSystemPattern,
    sdk.locales.default,
  ]);

  return (
    <div className={styles.designSystem}>
      <div className={styles.container}>
        {designSystemPattern === undefined ? (
          <>
            <SkeletonContainer>
              <SkeletonBodyText numberOfLines={4} />
            </SkeletonContainer>
          </>
        ) : designSystemPattern === null ? (
          <EmptyState
            headingProps={{ text: 'Design System not available' }}
            descriptionProps={{
              text:
                'Failed to load the design system documentation for this content type.',
            }}
          />
        ) : (
          <>
            <p>
              Last updated on:{' '}
              {new Date(designSystemPattern.sys.updatedAt).toLocaleDateString()}
            </p>
            <h2>
              {getEntryFieldValue(
                designSystemPattern.fields.name,
                designSystemPattern.sys.locale || sdk.locales.default,
              )}
            </h2>
            <p>
              {getEntryFieldValue(
                designSystemPattern.fields.description,
                designSystemPattern.sys.locale || sdk.locales.default,
              )}
            </p>
            <div className={styles.richText}>
              {documentToReactComponents(
                getEntryFieldValue(
                  designSystemPattern.fields.contentGuidelines,
                  designSystemPattern.sys.locale || sdk.locales.default,
                ),
                richTextOptions,
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EntryEditor;
