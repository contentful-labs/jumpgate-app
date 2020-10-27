import { Entry } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import React, { useState, useEffect } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Heading,
  Typography,
  EmptyState,
} from '@contentful/forma-36-react-components';

import {
  getExternalSourceDesignSystemPattern,
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

        if (internalSystemPattern !== null) {
          // We need to resolve assets by ourself
          internalSystemPattern.fields.previewImage = await sdk.space.getAsset(
            getEntryFieldValue(
              internalSystemPattern.fields.previewImage,
              internalSystemPattern.sys.locale || sdk.locales.default,
            ).sys.id,
          );
        }

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
            <Heading>
              {getEntryFieldValue(
                designSystemPattern.fields.title,
                designSystemPattern.sys.locale || sdk.locales.default,
              )}
            </Heading>
          </Typography>
          <img
            className={styles.previewImage}
            src={
              getEntryFieldValue(
                getEntryFieldValue(
                  designSystemPattern.fields.previewImage,
                  designSystemPattern.sys.locale || sdk.locales.default,
                ).fields.file,
                designSystemPattern.sys.locale || sdk.locales.default,
              ).url
            }
            alt="Design Systsem Pattern preview"
          />
        </>
      )}
    </div>
  );
};

export default EntryEditor;
