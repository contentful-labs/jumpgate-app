import { useMount } from 'ahooks';
import catchify from 'catchify';
import { createClient, Entry } from 'contentful';
import { AppExtensionSDK, ContentType } from 'contentful-ui-extensions-sdk';
import React, { useEffect, useState, useMemo, useCallback } from 'react';

import {
  Form,
  Paragraph,
  Subheading,
  Typography,
  SkeletonContainer,
  SkeletonBodyText,
  Note,
  Tabs,
  Tab,
  TabPanel,
  Card,
  Icon,
  IconButton,
  Button,
} from '@contentful/forma-36-react-components';

import {
  SOURCE_CONTENT_TYPE_ID,
  SOURCE_CONTENT_TYPE_NAME,
} from '../../../constants';
import {
  AppInstallationParameters,
  DesignSystemPatternFields,
} from '../../../types';
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

  // Tabs navigation
  const [activeTab, setActiveTab] = useState<
    null | 'spaceType' | 'designSystemPatternMatching'
  >(null);

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
    Entry<DesignSystemPatternFields>[] | null
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

      if (parameters.spaceType === 'sourceandconsumer') {
        await getSourceDesignSystemPatterns(sdk).then(
          setSourceDesignSystemPatterns,
        );
      }

      if (Object.keys(savedParameters).length > 0) {
        setActiveTab('designSystemPatternMatching');
      } else {
        setActiveTab('spaceType');
      }

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

    let client = null;

    try {
      client = createClient({
        space: appInstallationParameters.sourceSpaceId || '',
        accessToken: appInstallationParameters.sourceDeliveryToken || '',
      });
    } catch (e) {
      console.error(e);

      sdk.notifier.error(
        'Could not validate the source space connection. Double check that you have provided the correct Space ID and Delivery API Token.',
      );
      return false;
    }

    if (client === null) {
      return false;
    }

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

  // Fetch external source space design patterns when space is verified
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
      const newState: {
        EditorInterface: Record<string, any>;
      } = {
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

      // Not supported at the moment, the extensibility team is working on it

      // if (appInstallationParametersToSave.spaceType !== 'consumer') {
      //   // The space contains the design system patterns content type,
      //   // let's update its interface
      //   newState.EditorInterface[SOURCE_CONTENT_TYPE_ID] = {
      //     controls: [
      //       {
      //         fieldId: 'name',
      //         widgetId: 'singleLine',
      //         widgetNamespace: 'builtin',
      //       },
      //       {
      //         fieldId: 'description',
      //         widgetId: 'singleLine',
      //         widgetNamespace: 'builtin',
      //       },
      //       {
      //         fieldId: 'contentGuidelines',
      //         widgetId: 'richTextEditor',
      //         widgetNamespace: 'builtin',
      //       },
      //       {
      //         fieldId: 'iframePreviewUrl',
      //         settings: {
      //           helpText:
      //             'This could be a Storybook or any other URL where your component preview is hosted',
      //         },
      //         widgetId: 'urlEditor',
      //         widgetNamespace: 'builtin',
      //       },
      //     ],
      //   };
      // }

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

  const currentSpaceIsSource = useMemo(() => {
    if (
      appInstallationParameters === null ||
      appInstallationParameters.spaceType === null
    ) {
      return false;
    }

    return ['source', 'sourceandconsumer'].includes(
      appInstallationParameters.spaceType,
    );
  }, [appInstallationParameters]);

  const currentSpaceIsConsumer = useMemo(() => {
    if (
      appInstallationParameters === null ||
      appInstallationParameters.spaceType === null
    ) {
      return false;
    }

    return ['consumer', 'sourceandconsumer'].includes(
      appInstallationParameters.spaceType,
    );
  }, [appInstallationParameters]);

  const initialSetupDone = useMemo(() => {
    if (
      appInstallationParameters === null ||
      appInstallationParameters.spaceType === null
    ) {
      return false;
    }

    if (appInstallationParameters.spaceType === 'consumer') {
      if (
        !appInstallationParameters.sourceSpaceId ||
        !appInstallationParameters.sourceDeliveryToken
      ) {
        return false;
      }

      if (!appInstallationParameters.sourceConnectionValidated) {
        return false;
      }
    } else if (contentTypeExists === false) {
      return false;
    }

    return true;
  }, [appInstallationParameters, contentTypeExists]);

  if (appInstallationParameters === null) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerMenu}>
        <Tabs>
          {activeTab === 'spaceType' ? (
            <Tab id="spaceType" selected className={styles.tabWithIcon}>
              Initial Setup{' '}
              {initialSetupDone ? (
                <Icon color="positive" icon="CheckCircle" />
              ) : null}{' '}
            </Tab>
          ) : null}

          {(appInstallationParameters.spaceType === 'consumer' ||
            appInstallationParameters.spaceType === 'sourceandconsumer') &&
          activeTab === 'designSystemPatternMatching' ? (
            <Tab
              id="spaceType"
              selected
              disabled={
                (appInstallationParameters.spaceType === 'sourceandconsumer' &&
                  contentTypeExists === false) ||
                (appInstallationParameters.spaceType === 'consumer' &&
                  appInstallationParameters.sourceConnectionValidated === false)
              }
            >
              Design System Pattern Matching
            </Tab>
          ) : null}
        </Tabs>
        {activeTab !== 'spaceType' ? (
          <IconButton
            label="Settings"
            iconProps={{ icon: 'Settings', color: 'positive' }}
            onClick={() => {
              setActiveTab('spaceType');
            }}
          />
        ) : null}
      </div>

      {activeTab === 'spaceType' ? (
        <TabPanel id="spaceType" className={styles.tabContainer}>
          <Form>
            <Typography>
              <Paragraph>
                The <strong>Design System</strong> app does two things. You can
                define design system patterns, and you can assign patterns to
                content types in order to help editors understand them better.
                You can do these things in separate spaces (we recommend having
                a dedicated "Design System" space for better governance), or you
                can do both in the same space.
              </Paragraph>
              <Subheading className={styles.spacePurposeTitle}>
                What is the purpose of the app for this space?
              </Subheading>
            </Typography>

            <div className={styles.spacePurposeGrid}>
              <Card
                selected={currentSpaceIsSource}
                onClick={() => {
                  currentSpaceIsSource
                    ? appInstallationParameters.spaceType ===
                      'sourceandconsumer'
                      ? onSpaceTypeChange('consumer')
                      : onSpaceTypeChange(null)
                    : appInstallationParameters.spaceType === 'consumer'
                    ? onSpaceTypeChange('sourceandconsumer')
                    : onSpaceTypeChange('source');
                }}
              >
                <div className={styles.spacePurposeItem}>
                  <div
                    className={`${styles.spacePurposeIcon} ${
                      currentSpaceIsSource === true
                        ? styles.spacePurposeIconSelected
                        : ''
                    }`}
                  >
                    {currentSpaceIsSource === true ? (
                      <Icon color="primary" icon="Plus" />
                    ) : null}
                  </div>
                  <Paragraph>
                    <b>
                      I will be defining design system patterns in this space
                    </b>
                  </Paragraph>
                </div>
              </Card>
              <Card
                selected={currentSpaceIsConsumer}
                onClick={() => {
                  currentSpaceIsConsumer
                    ? appInstallationParameters.spaceType ===
                      'sourceandconsumer'
                      ? onSpaceTypeChange('source')
                      : onSpaceTypeChange(null)
                    : appInstallationParameters.spaceType === 'source'
                    ? onSpaceTypeChange('sourceandconsumer')
                    : onSpaceTypeChange('consumer');
                }}
              >
                <div className={styles.spacePurposeItem}>
                  <div
                    className={`${styles.spacePurposeIcon} ${
                      currentSpaceIsConsumer === true
                        ? styles.spacePurposeIconSelected
                        : ''
                    }`}
                  >
                    {currentSpaceIsConsumer === true ? (
                      <Icon color="primary" icon="Plus" />
                    ) : null}
                  </div>
                  <Paragraph>
                    <b>
                      I have content types in this space that I want to document
                    </b>
                  </Paragraph>
                </div>
              </Card>
            </div>
          </Form>

          {currentSpaceIsSource ? (
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
                      The app will generate a content type in this space that
                      will serve as your Design System patterns source.
                    </Paragraph>
                  </Typography>
                  {contentTypeExists === true ? (
                    <Note noteType="positive">
                      Design System Pattern content type is present in this
                      space.
                    </Note>
                  ) : (
                    <Note>
                      Installing this app will automatically create a new
                      content type in this space.
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

          {initialSetupDone === true ? (
            <div className={styles.goToDesignSystemPatternMatching}>
              <Button
                onClick={() => {
                  setActiveTab('designSystemPatternMatching');
                }}
                buttonType="primary"
              >
                Go to the next step
              </Button>
            </div>
          ) : null}
        </TabPanel>
      ) : null}

      {activeTab === 'designSystemPatternMatching' ? (
        <TabPanel
          id="designSystemPatternMatching"
          className={styles.tabContainer}
        >
          <DesignSystemPatternMatcher
            sdk={sdk}
            appInstallationParameters={appInstallationParameters}
            setAppInstallationParameters={setAppInstallationParameters}
            contentTypes={contentTypes}
            sourceDesignSystemPatterns={sourceDesignSystemPatterns}
          />
        </TabPanel>
      ) : null}
    </div>
  );
};

export default Config;
