import { Entry } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  EmptyState,
  Paragraph,
  Icon,
} from '@contentful/forma-36-react-components';
import {
  documentToReactComponents,
  Options,
} from '@contentful/rich-text-react-renderer';
import { BLOCKS } from '@contentful/rich-text-types';

import {
  getSourceGuideline,
  getExternalSourceGuideline,
} from '../../../config/getSourceGuidelines';
import { AppInstallationParameters, GuidelineFields } from '../../../types';
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

  const [guideline, setGuideline] = useState<
    Entry<GuidelineFields> | null | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      if (
        installationParameters.patternMatches[sdk.contentType.sys.id] ===
        undefined
      ) {
        setGuideline(null);
        return;
      }

      if (installationParameters.spaceType === 'consumer') {
        setGuideline(
          await getExternalSourceGuideline(
            installationParameters.sourceSpaceId!,
            installationParameters.sourceDeliveryToken!,
            installationParameters.patternMatches[sdk.contentType.sys.id],
          ),
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        const internalSystemPattern = await getSourceGuideline(
          sdk,
          installationParameters.patternMatches[sdk.contentType.sys.id],
        );

        setGuideline(internalSystemPattern);
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

  const [guidelines, setGuidelines] = useState<
    Record<string, Entry<GuidelineFields> | null | undefined>
  >({});

  const loadGuideline = useCallback(
    async (entryId: string): Promise<void> => {
      setGuidelines({
        ...guidelines,
        [entryId]: null,
      });

      let loadedGuideline = null;

      if (installationParameters.spaceType === 'consumer') {
        loadedGuideline = await getExternalSourceGuideline(
          installationParameters.sourceSpaceId!,
          installationParameters.sourceDeliveryToken!,
          entryId,
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        loadedGuideline = await getSourceGuideline(sdk, entryId);
      }

      if (loadedGuideline === null) {
        return;
      }

      setGuidelines({
        ...guidelines,
        [entryId]: loadedGuideline,
      });
    },
    [
      guidelines,
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
          const guideline = guidelines[entryId];

          if (guideline === undefined) {
            loadGuideline(entryId);
            return null;
          }

          if (guideline === null) {
            return null;
          }

          return (
            <div className={styles.richText}>
              {documentToReactComponents(
                getEntryFieldValue(
                  guideline.fields.content,
                  guideline.sys.locale || sdk.locales.default,
                ),
                richTextOptions,
              )}
            </div>
          );
        },
      },
    };

    return options;
  }, [guidelines, loadGuideline, sdk]);

  const [iframeHeight, setIframeHeight] = useState<number>();
  const iframePreviewUrl = useMemo<string>(() => {
    if (guideline === null || guideline === undefined) {
      return '';
    }

    return (
      getEntryFieldValue(
        guideline.fields.externalReferenceUrl,
        guideline.sys.locale || sdk.locales.default,
      ) || ''
    );
  }, [guideline, sdk.locales.default]);
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
    <div className={styles.entryEditor}>
      {guideline === undefined ? (
        <div className={styles.container}>
          <SkeletonContainer>
            <SkeletonBodyText numberOfLines={4} />
          </SkeletonContainer>
        </div>
      ) : guideline === null ? (
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
        <main>
          <div className={styles.entryEditorTop}>
            <div className={styles.container}>
              <h1 className={styles.mainHeading}>
                {getEntryFieldValue(
                  guideline.fields.name,
                  guideline.sys.locale || sdk.locales.default,
                )}
              </h1>
              <p className={styles.shortDescription}>
                {getEntryFieldValue(
                  guideline.fields.description,
                  guideline.sys.locale || sdk.locales.default,
                )}
              </p>
            </div>
            {iframePreviewUrl ? (
              <>
                <div className={styles.previewIntro}>
                  <h2 className={styles.previewIntroHeading}>
                    Example preview:
                  </h2>
                  <div>
                    <button
                      className={styles.previewButton}
                      onClick={() => {
                        window.open(iframePreviewUrl);
                      }}
                    >
                      <Icon
                        icon="ExternalLink"
                        className={styles.previewButtonIcon}
                      />
                      Open in a new window
                    </button>
                    {isStorybookIframe ? (
                      <button
                        className={styles.previewButton}
                        onClick={() => {
                          window.open(
                            iframePreviewUrl
                              .split('?')[0]
                              .replace('iframe.html', ''),
                          );
                        }}
                      >
                        <Icon
                          icon="ExternalLink"
                          className={styles.previewButtonIcon}
                        />
                        Open full documentation
                      </button>
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
                        guideline.fields.externalReferenceUrl,
                        guideline.sys.locale || sdk.locales.default,
                      )}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <div className={styles.entryEditorContent}>
            <div className={styles.designSystem}>
              <div className={styles.container}>
                <div className={styles.richText}>
                  {documentToReactComponents(
                    getEntryFieldValue(
                      guideline.fields.content,
                      guideline.sys.locale || sdk.locales.default,
                    ),
                    richTextOptions,
                  )}
                </div>
              </div>
            </div>
          </div>
          <footer className={styles.entryEditorFooter}>
            <div className={styles.container}>
              <p>
                Last updated on:{' '}
                {new Date(guideline.sys.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
};

export default EntryEditor;
