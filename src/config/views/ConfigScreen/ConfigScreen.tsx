import { useMount } from 'ahooks';
import catchify from 'catchify';
import { createClient } from 'contentful';
import { AppExtensionSDK, ContentType } from 'contentful-ui-extensions-sdk';
import React, { useEffect, useState, useMemo, useCallback } from 'react';

import {
  Form,
  Paragraph,
  RadioButtonField,
  Subheading,
  Typography,
  SkeletonContainer,
  SkeletonBodyText,
  Note,
} from '@contentful/forma-36-react-components';

import {
  SOURCE_CONTENT_TYPE_ID,
  SOURCE_CONTENT_TYPE_NAME,
} from '../../../constants';
import { AppInstallationParameters } from '../../../types';
import createDesignSystemPatternContentType from '../../createDesignSystemPatternContentType';
import {
  getSourceDesignSystemPatterns,
  getExternalSourceDesignSystemPatterns,
} from '../../getSourceDesignSystemPatterns';
import styles from './ConfigScreen.module.css';
import DesignSystemPatternMatcher from './DesignSystemPatternMatcher/DesignSystemPatternMatcher';
import SpaceSelector from './SpaceSelector/SpaceSelector';

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const defaultParameters: AppInstallationParameters = {
  spaceType: null,
  sourceSpaceId: null,
  sourceDeliveryToken: null,
  sourceConnectionValidated: false,
  patternMatches: {},
};

const Config: React.FC<ConfigProps> = (props) => {
  const { sdk } = props;

  // Load and store content types for the current space
  const [contentTypes, setContentTypes] = useState<ContentType[] | null>(null);

  // eslint-disable-next-line
  const fetchCurrentSpaceContentTypes = async (): Promise<void> => {
    const spaceContentTypes = await sdk.space.getContentTypes<ContentType>();

    setContentTypes(spaceContentTypes.items);
  };

  useMount(() => {
    fetchCurrentSpaceContentTypes();
  });

  // Check if the space already contains a needed content type
  const contentTypeExists = useMemo(() => {
    if (contentTypes === null || contentTypes.length === 0) {
      return false;
    }

    return contentTypes.some(
      (contentType) => contentType.sys.id === SOURCE_CONTENT_TYPE_ID,
    );
  }, [contentTypes]);

  // Source space design system patterns (could be from this space, or another)
  const [sourceDesignSystemPatterns, setSourceDesignSystemPatterns] = useState<
    Object[] | null
  >(null);

  // Installation parameters
  const [
    appInstallationParameters,
    setAppInstallationParameters,
  ] = useState<AppInstallationParameters | null>(null);
  const sourceConnectionIsValidated = useMemo(() => {
    if (appInstallationParameters === null) {
      return false;
    }

    if (appInstallationParameters.spaceType === 'sourceandconsumer') {
      return true;
    }

    return appInstallationParameters.sourceConnectionValidated;
  }, [appInstallationParameters]);

  useMount(() => {
    (async () => {
      const savedParameters = (await sdk.app.getParameters()) || {};

      const parameters: AppInstallationParameters = {
        ...defaultParameters,
        ...savedParameters,
      };

      setAppInstallationParameters(parameters);

      sdk.app.setReady();
    })();
  });

  const onSpaceTypeChange = async (
    spaceType: AppInstallationParameters['spaceType'],
  ): Promise<void> => {
    if (appInstallationParameters === null) {
      return;
    }

    setSourceDesignSystemPatterns(null);

    const newAppInstallationparameters = {
      ...appInstallationParameters,
      spaceType,
    };

    if (spaceType === 'consumer') {
      newAppInstallationparameters.sourceConnectionValidated = false;
    } else if (spaceType === 'sourceandconsumer') {
      newAppInstallationparameters.sourceConnectionValidated = true;
      getSourceDesignSystemPatterns(sdk).then(setSourceDesignSystemPatterns);
    }

    setAppInstallationParameters(newAppInstallationparameters);
  };

  // Source space connection validation
  const validateSourceSpaceConnection = useCallback(async () => {
    if (appInstallationParameters === null) {
      return false;
    }

    const client = createClient({
      space: appInstallationParameters.sourceSpaceId || '',
      accessToken: appInstallationParameters.sourceDeliveryToken || '',
    });

    const [spaceCheckError] = await catchify(client.getSpace());

    if (spaceCheckError !== null) {
      sdk.notifier.error(
        'Could not validate the source space connection. Double check that you have provided the correct Space ID and Delivery API Token.',
      );
      return false;
    }

    const [contentTypeCheckError] = await catchify(
      client.getContentType(SOURCE_CONTENT_TYPE_ID),
    );

    if (contentTypeCheckError !== null) {
      sdk.notifier.error(
        `Successfully connected to the source space, but could not find the "${SOURCE_CONTENT_TYPE_NAME}" content type. Make sure you install the app in that space first and configure it as a "Design system source".`,
      );
      return false;
    }

    return true;
  }, [appInstallationParameters, sdk.notifier]);

  // Fetch external source space content types when space is verified
  useEffect(() => {
    (async () => {
      if (
        sourceConnectionIsValidated === false ||
        appInstallationParameters === null
      ) {
        return;
      }

      if (appInstallationParameters.spaceType !== 'consumer') {
        return;
      }

      if (
        appInstallationParameters.sourceSpaceId === null ||
        appInstallationParameters.sourceDeliveryToken === null
      ) {
        return;
      }

      setSourceDesignSystemPatterns(
        await getExternalSourceDesignSystemPatterns(
          appInstallationParameters.sourceSpaceId,
          appInstallationParameters.sourceDeliveryToken,
        ),
      );
    })();
  }, [appInstallationParameters, sdk, sourceConnectionIsValidated]);

  const onVerify = useCallback(async () => {
    if (appInstallationParameters === null) {
      return;
    }

    const spaceConnectionValidated = await validateSourceSpaceConnection();

    setAppInstallationParameters({
      ...appInstallationParameters,
      sourceConnectionValidated: spaceConnectionValidated,
    });
  }, [appInstallationParameters, validateSourceSpaceConnection]);

  // Handle app installation
  useEffect(() => {
    sdk.app.onConfigure(async () => {
      const appInstallationParametersToSave = appInstallationParameters;

      if (appInstallationParametersToSave === null) {
        return false;
      }

      if (appInstallationParametersToSave.spaceType === null) {
        sdk.notifier.error(
          'You need to select one of the "Space type" options before installing the app.',
        );
        return false;
      }

      if (appInstallationParametersToSave.spaceType === 'consumer') {
        if (
          !appInstallationParametersToSave.sourceSpaceId ||
          !appInstallationParametersToSave.sourceDeliveryToken
        ) {
          sdk.notifier.error(
            'You need to provide the source Space ID and a Delivery API Token.',
          );
          return false;
        }

        const sourceSpaceValidated = await validateSourceSpaceConnection();

        if (sourceSpaceValidated !== true) {
          return false;
        }

        appInstallationParametersToSave.sourceConnectionValidated = true;
        setAppInstallationParameters({
          ...appInstallationParametersToSave,
        });
      } else {
        // This space is not a consumer, so we need to create a content type to
        // hold the design system patterns
        if (contentTypeExists === false) {
          await createDesignSystemPatternContentType({ sdk });
          await fetchCurrentSpaceContentTypes();
        }
      }

      const currentState = (await sdk.app.getCurrentState()) || {
        EditorInterface: {},
      };
      const newState = {
        ...currentState,
        EditorInterface: {
          ...currentState.EditorInterface,
          ...Object.keys(appInstallationParametersToSave.patternMatches).reduce(
            (acc, contentTypeId) => {
              return {
                ...acc,
                [contentTypeId]:
                  appInstallationParametersToSave.patternMatches[
                    contentTypeId
                  ] === ''
                    ? {}
                    : {
                        editors: [
                          {
                            widgetNamespace: 'app',
                            widgetId: 'pattern-reference',
                          },
                        ],
                      },
              };
            },
            {},
          ),
        },
      };

      return {
        parameters: appInstallationParametersToSave,
        targetState: newState,
      };
    });
  }, [
    appInstallationParameters,
    sdk.app,
    sdk.notifier,
    contentTypeExists,
    sdk,
    fetchCurrentSpaceContentTypes,
    validateSourceSpaceConnection,
  ]);

  if (appInstallationParameters === null) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Form>
        <Typography>
          <Subheading>Space type</Subheading>
          <Paragraph>
            Is this your design system <strong>source</strong> space, or will
            you be pulling in a design system <strong>to</strong> this space?
          </Paragraph>
        </Typography>
        <RadioButtonField
          labelText="Design system source"
          helpText="Design System will be defined in this space"
          name="spaceType"
          checked={appInstallationParameters.spaceType === 'source'}
          value="source"
          id="spaceTypeCheckbox1"
          onChange={() => {
            onSpaceTypeChange('source');
          }}
        />
        <RadioButtonField
          labelText="Design system consumer"
          helpText="This space will pull a design system from another space"
          name="spaceType"
          checked={appInstallationParameters.spaceType === 'consumer'}
          value="consumer"
          id="spaceTypeCheckbox2"
          onChange={() => {
            onSpaceTypeChange('consumer');
          }}
        />
        <RadioButtonField
          labelText="Both a source and a consumer"
          helpText="Choose this option if you will be both defining and consuming a design system in this space"
          name="spaceType"
          checked={appInstallationParameters.spaceType === 'sourceandconsumer'}
          value="sourceandconsumer"
          id="spaceTypeCheckbox3"
          onChange={() => {
            onSpaceTypeChange('sourceandconsumer');
          }}
        />
      </Form>

      {appInstallationParameters.spaceType?.includes('source') ? (
        <div className={styles.section}>
          {contentTypes === null ? (
            <SkeletonContainer>
              <SkeletonBodyText numberOfLines={2} />
            </SkeletonContainer>
          ) : (
            <div>
              <Typography>
                <Subheading>Design System Source - content type</Subheading>
                <Paragraph>
                  The app will generate a content type in this space that will
                  serve as your Design System patterns source.
                </Paragraph>
              </Typography>
              {contentTypeExists === true ? (
                <Note noteType="positive">
                  Design System Pattern content type is present in this space.
                </Note>
              ) : (
                <Note>
                  Installing this app will automatically create a new content
                  type in this space.
                </Note>
              )}
            </div>
          )}
        </div>
      ) : null}

      {appInstallationParameters.spaceType === 'consumer' ? (
        <SpaceSelector
          sdk={sdk}
          appInstallationParameters={appInstallationParameters}
          setAppInstallationParameters={setAppInstallationParameters}
          onVerify={onVerify}
        />
      ) : null}

      {['consumer', 'sourceandconsumer'].includes(
        appInstallationParameters.spaceType || '',
      ) ? (
        <DesignSystemPatternMatcher
          appInstallationParameters={appInstallationParameters}
          setAppInstallationParameters={setAppInstallationParameters}
          contentTypes={contentTypes}
          sourceDesignSystemPatterns={sourceDesignSystemPatterns}
        />
      ) : null}
    </div>
  );
};

export default Config;
