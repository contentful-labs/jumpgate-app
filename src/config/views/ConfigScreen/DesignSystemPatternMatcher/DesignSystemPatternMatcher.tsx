import { Entry } from 'contentful';
import { AppExtensionSDK, ContentType } from 'contentful-ui-extensions-sdk';
import React, { useMemo } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Subheading,
  SelectField,
  Option,
  Typography,
  Form,
} from '@contentful/forma-36-react-components';

import { SOURCE_CONTENT_TYPE_ID } from '../../../../constants';
import {
  AppInstallationParameters,
  DesignSystemPatternFields,
} from '../../../../types';
import getEntryFieldValue from '../../../../utils/getEntryFieldValue';
import styles from './DesignSystemPatternMatcher.module.css';

interface DesignSystemPatternMatcherProps {
  sdk: AppExtensionSDK;
  appInstallationParameters: AppInstallationParameters;
  setAppInstallationParameters: React.Dispatch<
    React.SetStateAction<AppInstallationParameters | null>
  >;
  contentTypes: ContentType[] | null;
  sourceDesignSystemPatterns: Entry<DesignSystemPatternFields>[] | null;
}

const DesignSystemPatternMatcher: React.FC<DesignSystemPatternMatcherProps> = (
  props,
) => {
  const {
    sdk,
    appInstallationParameters,
    setAppInstallationParameters,
    contentTypes,
    sourceDesignSystemPatterns,
  } = props;

  const filteredContentTypes = useMemo(() => {
    if (contentTypes === null) {
      return [];
    }

    return contentTypes.filter(
      (contentType) => contentType.sys.id !== SOURCE_CONTENT_TYPE_ID,
    );
  }, [contentTypes]);

  if (
    appInstallationParameters.spaceType === 'consumer' &&
    appInstallationParameters.sourceConnectionValidated === false
  ) {
    return null;
  }

  return sourceDesignSystemPatterns === null || contentTypes === null ? (
    <SkeletonContainer>
      <SkeletonBodyText numberOfLines={4} />
    </SkeletonContainer>
  ) : (
    <div className={styles.container}>
      <Typography>
        <Subheading className={styles.heading}>
          Assign design system patterns to space content types
        </Subheading>
        <Form>
          {filteredContentTypes.map((contentType) => (
            <SelectField
              key={contentType.sys.id}
              name="optionSelect"
              id="optionSelect"
              labelText={contentType.name}
              value={
                appInstallationParameters.patternMatches[contentType.sys.id] ||
                ''
              }
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setAppInstallationParameters({
                  ...appInstallationParameters,
                  patternMatches: {
                    ...appInstallationParameters.patternMatches,
                    [contentType.sys.id]: e.target.value,
                  },
                });
              }}
            >
              <Option value="">N/A - No assignment</Option>
              {sourceDesignSystemPatterns.map((designSystemPattern) => (
                <Option
                  key={designSystemPattern.sys.id}
                  value={designSystemPattern.sys.id}
                >
                  {getEntryFieldValue(
                    designSystemPattern.fields.title,
                    designSystemPattern.sys.locale || sdk.locales.default,
                  )}
                </Option>
              ))}
            </SelectField>
          ))}
        </Form>
      </Typography>
    </div>
  );
};

export default DesignSystemPatternMatcher;
