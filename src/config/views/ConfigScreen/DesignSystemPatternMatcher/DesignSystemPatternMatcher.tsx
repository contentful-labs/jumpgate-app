import { ContentType } from 'contentful-ui-extensions-sdk';
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
import { AppInstallationParameters } from '../../../../types';
import styles from './DesignSystemPatternMatcher.module.css';

interface DesignSystemPatternMatcherProps {
  appInstallationParameters: AppInstallationParameters;
  setAppInstallationParameters: React.Dispatch<
    React.SetStateAction<AppInstallationParameters | null>
  >;
  contentTypes: ContentType[] | null;
  sourceDesignSystemPatterns: Object[] | null;
}

const DesignSystemPatternMatcher: React.FC<DesignSystemPatternMatcherProps> = (
  props,
) => {
  const {
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
                  key={(designSystemPattern as any).sys.id}
                  value={(designSystemPattern as any).sys.id}
                >
                  {(designSystemPattern as any).fields.title}
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
