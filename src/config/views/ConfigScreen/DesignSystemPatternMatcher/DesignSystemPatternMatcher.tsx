import { Entry } from 'contentful';
import { AppExtensionSDK, ContentType } from 'contentful-ui-extensions-sdk';
import React, { useEffect, useMemo } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Subheading,
  SelectField,
  Option,
  Typography,
  Form,
  EmptyState,
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

  const fallbackToNameMatchWhenNoValue = (contentType: ContentType): string => {
    if (
      typeof appInstallationParameters.patternMatches[contentType.sys.id] !==
      'undefined'
    ) {
      return appInstallationParameters.patternMatches[contentType.sys.id];
    }

    return (
      sourceDesignSystemPatterns?.find((designSystemPattern) => {
        const name = getEntryFieldValue(
          designSystemPattern.fields.name,
          designSystemPattern.sys.locale || sdk.locales.default,
        ) as string;

        return (
          name.startsWith(contentType.name) || name.endsWith(contentType.name)
        );
      })?.sys.id || ''
    );
  };

  // Populate defaults
  useEffect(() => {
    if (
      sourceDesignSystemPatterns === null ||
      sourceDesignSystemPatterns.length === null ||
      filteredContentTypes.length === 0
    ) {
      return;
    }

    const newPatternMatches: Record<string, string> = {};

    filteredContentTypes.forEach((contentType) => {
      if (
        typeof appInstallationParameters.patternMatches[contentType.sys.id] !==
        'undefined'
      ) {
        return;
      }

      const nameMatchingDesignSystemPattern = sourceDesignSystemPatterns?.find(
        (designSystemPattern) => {
          const name = getEntryFieldValue(
            designSystemPattern.fields.name,
            designSystemPattern.sys.locale || sdk.locales.default,
          ) as string;

          return (
            name.startsWith(contentType.name) || name.endsWith(contentType.name)
          );
        },
      )?.sys.id;

      if (nameMatchingDesignSystemPattern === undefined) {
        return;
      }

      newPatternMatches[contentType.sys.id] = nameMatchingDesignSystemPattern;
    });

    if (Object.keys(newPatternMatches).length > 0) {
      setAppInstallationParameters({
        ...appInstallationParameters,
        patternMatches: {
          ...appInstallationParameters.patternMatches,
          ...newPatternMatches,
        },
      });
    }
  }, [
    appInstallationParameters,
    filteredContentTypes,
    sdk.locales.default,
    setAppInstallationParameters,
    sourceDesignSystemPatterns,
  ]);

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
  ) : sourceDesignSystemPatterns.length === 0 ? (
    <div className={styles.container}>
      <EmptyState
        headingProps={{ text: 'No Design System Patterns (yet!)' }}
        descriptionProps={{
          text:
            "It looks like your Design System Source space has no published patterns. Don't worry, as soon as some get published, you can come back here and assign them to your content types.",
        }}
      />
    </div>
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
              value={fallbackToNameMatchWhenNoValue(contentType)}
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
              {/* SOLVE onChange not firing for default values */}
              <Option value="">N/A - No assignment</Option>
              {sourceDesignSystemPatterns.map((designSystemPattern) => (
                <Option
                  key={designSystemPattern.sys.id}
                  value={designSystemPattern.sys.id}
                >
                  {getEntryFieldValue(
                    designSystemPattern.fields.name,
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
