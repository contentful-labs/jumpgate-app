import { Entry } from 'contentful';
import { AppExtensionSDK, ContentType } from 'contentful-ui-extensions-sdk';
import React, { useEffect, useMemo, useState } from 'react';

import {
  SkeletonContainer,
  SkeletonBodyText,
  Select,
  Option,
  Typography,
  Form,
  EmptyState,
  Paragraph,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  HelpText,
  Icon,
  Tooltip,
} from '@contentful/forma-36-react-components';

import { SOURCE_CONTENT_TYPE_ID } from '../../../../constants';
import { AppInstallationParameters, GuidelineFields } from '../../../../types';
import getEntryFieldValue from '../../../../utils/getEntryFieldValue';
import styles from './GuidelineMatcher.module.css';

interface GuidelineMatcherProps {
  sdk: AppExtensionSDK;
  appInstallationParameters: AppInstallationParameters;
  setAppInstallationParameters: React.Dispatch<
    React.SetStateAction<AppInstallationParameters | null>
  >;
  contentTypes: ContentType[] | null;
  sourceGuidelines: Entry<GuidelineFields>[] | null;
}

const GuidelineMatcher: React.FC<GuidelineMatcherProps> = (props) => {
  const {
    sdk,
    appInstallationParameters,
    setAppInstallationParameters,
    contentTypes,
    sourceGuidelines,
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
      sourceGuidelines?.find((designSystemPattern) => {
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

  // A list of matches that we auto-suggested based the naming
  const [suggestedMatches, setSuggestedMatches] = useState<string[]>([]);

  // Populate defaults
  useEffect(() => {
    if (
      sourceGuidelines === null ||
      sourceGuidelines.length === null ||
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

      const nameMatchingGuideline = sourceGuidelines?.find(
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

      if (nameMatchingGuideline === undefined) {
        return;
      }

      newPatternMatches[contentType.sys.id] = nameMatchingGuideline;
      setSuggestedMatches((x) => [...x, contentType.sys.id]);
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
    sourceGuidelines,
  ]);

  if (
    appInstallationParameters.spaceType === 'consumer' &&
    appInstallationParameters.sourceConnectionValidated === false
  ) {
    return null;
  }

  return sourceGuidelines === null || contentTypes === null ? (
    <SkeletonContainer>
      <SkeletonBodyText numberOfLines={4} />
    </SkeletonContainer>
  ) : sourceGuidelines.length === 0 ? (
    <EmptyState
      headingProps={{ text: 'Nothing to see here (yet!)' }}
      descriptionProps={{
        text:
          'Once you publish some guidelines in the source space, they will show up here allowing you to assign them to the content types in the target space.',
      }}
    />
  ) : (
    <Typography>
      <Paragraph>
        The form below allows you to assign the guidelines from the source space
        to a specific content type within this space. Once assigned, the
        guidelines will be displayed for all the entries of the chosen type,
        under the Jumpgate tab in the entry editor view.
      </Paragraph>
      <Form>
        <Table>
          <TableHead isSticky>
            <TableRow>
              <TableCell>
                <Tooltip content="Content types of this space" usePortal>
                  <div className={styles.tableHeadCell}>
                    Content Type{' '}
                    <Icon
                      icon="HelpCircle"
                      className={styles.tableHeadCellIcon}
                      color="muted"
                    />
                  </div>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Tooltip
                  content="Guidelines defined in the source space"
                  usePortal
                >
                  <div className={styles.tableHeadCell}>
                    Guideline{' '}
                    <Icon
                      icon="HelpCircle"
                      className={styles.tableHeadCellIcon}
                      color="muted"
                    />
                  </div>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContentTypes.map((contentType) => (
              <TableRow key={contentType.sys.id}>
                <TableCell>
                  <div className={styles.contentTypeLabel}>
                    {contentType.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    name="optionSelect"
                    id="optionSelect"
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
                    <Option value="">No selection</Option>
                    {sourceGuidelines.map((designSystemPattern) => (
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
                  </Select>
                  {suggestedMatches.includes(contentType.sys.id) === true ? (
                    <HelpText className={styles.helpText}>
                      <Icon
                        icon="InfoCircle"
                        color="muted"
                        className={styles.helpTextIcon}
                      />{' '}
                      Suggested automatically based on a matching name
                    </HelpText>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Form>
    </Typography>
  );
};

export default GuidelineMatcher;
