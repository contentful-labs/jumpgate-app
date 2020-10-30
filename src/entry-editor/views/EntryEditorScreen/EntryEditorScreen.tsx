import { Entry, Asset } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Heading,
  Typography,
  EmptyState,
  Paragraph,
  Subheading,
} from '@contentful/forma-36-react-components';
import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';

import {
  getExternalSourceDesignSystemPattern,
  getSourceAsset,
  getSourceDesignSystemPattern,
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

      const loadedAsset = await getSourceAsset(sdk, assetId);

      if (loadedAsset === null) {
        return;
      }

      setAssets({
        ...assets,
        [assetId]: loadedAsset,
      });
    },
    [assets, sdk],
  );

  const richTextOptions = useMemo(() => {
    const options: Options = {
      renderNode: {
        [BLOCKS.HEADING_1]: (_node, children) => {
          return <Heading>{children}</Heading>;
        },
        [BLOCKS.HEADING_2]: (_node, children) => {
          return <Subheading>{children}</Subheading>;
        },
        [BLOCKS.HEADING_3]: (_node, children) => {
          return <Subheading element="h3">{children}</Subheading>;
        },
        [BLOCKS.HEADING_4]: (_node, children) => {
          return <Subheading element="h4">{children}</Subheading>;
        },
        [BLOCKS.PARAGRAPH]: (_node, children) => {
          return <Paragraph>{children}</Paragraph>;
        },
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
            <img
              src={file.url}
              alt={getEntryFieldValue(
                asset.fields.title,
                asset.sys.locale || sdk.locales.default,
              )}
              width={file.details.image.width}
              height={file.details.image.height}
            />
          );
        },
      },
    };

    return options;
  }, [assets, loadAsset, sdk.locales.default]);

  return (
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
          <Typography>
            <Paragraph>
              Last updated on:{' '}
              {new Date(designSystemPattern.sys.updatedAt).toLocaleDateString()}
            </Paragraph>
            <Heading>
              {getEntryFieldValue(
                designSystemPattern.fields.name,
                designSystemPattern.sys.locale || sdk.locales.default,
              )}
            </Heading>
            <Paragraph>
              {getEntryFieldValue(
                designSystemPattern.fields.description,
                designSystemPattern.sys.locale || sdk.locales.default,
              )}
            </Paragraph>
            <div className={styles.richText}>
              {documentToReactComponents(
                getEntryFieldValue(
                  designSystemPattern.fields.contentGuidelines,
                  designSystemPattern.sys.locale || sdk.locales.default,
                ),
                richTextOptions,
              )}
            </div>
          </Typography>
        </>
      )}
    </div>
  );
};

export default EntryEditor;
