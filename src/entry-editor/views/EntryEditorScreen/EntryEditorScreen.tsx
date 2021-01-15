import { Entry } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  EmptyState,
  Subheading,
  Paragraph,
  Heading,
  Typography,
  Button,
} from '@contentful/forma-36-react-components';
import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';

import {
  getSourceDesignSystemPattern,
  getExternalSourceDesignSystemPattern,
} from '../../../config/getSourceDesignSystemPatterns';
import {
  AppInstallationParameters,
  DesignSystemPatternFields,
} from '../../../types';
import getEntryFieldValue from '../../../utils/getEntryFieldValue';
import LazyAsset from '../../components/LazyAsset';
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
          return <LazyAsset id={assetId} sdk={sdk} />;
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
  }, [designSystemPatterns, loadDesignSystemPattern, sdk]);

  const [iframeHeight, setIframeHeight] = useState<number>();
  const iframePreviewUrl = useMemo<string>(() => {
    if (designSystemPattern === null || designSystemPattern === undefined) {
      return '';
    }

    return (
      getEntryFieldValue(
        designSystemPattern.fields.iframePreviewUrl,
        designSystemPattern.sys.locale || sdk.locales.default,
      ) || ''
    );
  }, [designSystemPattern, sdk.locales.default]);
  const isStorybookIframe = useMemo(() => {
    return iframePreviewUrl.includes('&viewMode=story');
  }, [iframePreviewUrl]);

  useEffect(() => {
    const onIframeMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        if (typeof data.design_system_app_preview_content_height !== 'number') {
          return;
        }

        setIframeHeight(data.design_system_app_preview_content_height);
      } catch {}
    };

    window.addEventListener('message', onIframeMessage);

    return () => {
      window.removeEventListener('message', onIframeMessage);
      setIframeHeight(undefined);
    };
  }, []);

  return (
    <>
      {designSystemPattern === undefined ? (
        <div className={styles.container}>
          <SkeletonContainer>
            <SkeletonBodyText numberOfLines={4} />
          </SkeletonContainer>
        </div>
      ) : designSystemPattern === null ? (
        <div className={styles.container}>
          <EmptyState
            headingProps={{ text: 'Design System not available' }}
            descriptionProps={{
              text:
                'Failed to load the design system documentation for this content type.',
            }}
          />
        </div>
      ) : (
        <>
          <div className={styles.container}>
            <Typography>
              <Heading>
                {getEntryFieldValue(
                  designSystemPattern.fields.name,
                  designSystemPattern.sys.locale || sdk.locales.default,
                )}
              </Heading>
            </Typography>
            <div className={styles.designSystem}>
              <p>
                {getEntryFieldValue(
                  designSystemPattern.fields.description,
                  designSystemPattern.sys.locale || sdk.locales.default,
                )}
              </p>
            </div>
          </div>
          {iframePreviewUrl ? (
            <>
              <div className={styles.previewIntro}>
                <Subheading>Example preview:</Subheading>
                <div>
                  <Button
                    onClick={() => {
                      window.open(iframePreviewUrl);
                    }}
                    buttonType="naked"
                    size="small"
                    icon="ExternalLink"
                  >
                    Open in a new window
                  </Button>
                  {isStorybookIframe ? (
                    <Button
                      onClick={() => {
                        window.open(
                          iframePreviewUrl
                            .split('?')[0]
                            .replace('iframe.html', ''),
                        );
                      }}
                      buttonType="naked"
                      size="small"
                      icon="ExternalLink"
                    >
                      Open full documentation
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className={styles.containerPreview}>
                <div
                  className={`${styles.iframeContainer} ${
                    iframeHeight === undefined
                      ? ''
                      : styles.iframeContainerWithHeight
                  }`}
                  style={{
                    height: iframeHeight ? iframeHeight + 20 : undefined,
                  }}
                >
                  <iframe
                    title="Preview"
                    src={getEntryFieldValue(
                      designSystemPattern.fields.iframePreviewUrl,
                      designSystemPattern.sys.locale || sdk.locales.default,
                    )}
                  />
                </div>
              </div>
            </>
          ) : null}
          <div className={styles.designSystem}>
            <div className={styles.container}>
              <div className={styles.richText}>
                {documentToReactComponents(
                  getEntryFieldValue(
                    designSystemPattern.fields.contentGuidelines,
                    designSystemPattern.sys.locale || sdk.locales.default,
                  ),
                  richTextOptions,
                )}
              </div>
            </div>
          </div>

          <div className={styles.container}>
            <Paragraph>
              Last updated on:{' '}
              {new Date(designSystemPattern.sys.updatedAt).toLocaleDateString()}
            </Paragraph>
          </div>
        </>
      )}
    </>
  );
};

export default EntryEditor;
