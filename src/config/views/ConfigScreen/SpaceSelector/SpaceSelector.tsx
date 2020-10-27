import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import React from 'react';

import {
  Form,
  Paragraph,
  Subheading,
  TextField,
  Typography,
  Tag,
  Button,
} from '@contentful/forma-36-react-components';

import { AppInstallationParameters } from '../../../../types';
import styles from './SpaceSelector.module.css';

interface SpaceSelectorProps {
  sdk: AppExtensionSDK;
  appInstallationParameters: AppInstallationParameters;
  setAppInstallationParameters: React.Dispatch<
    React.SetStateAction<AppInstallationParameters | null>
  >;
  onVerify: () => Promise<void>;
}

const SpaceSelector: React.FC<SpaceSelectorProps> = (props) => {
  const {
    appInstallationParameters,
    setAppInstallationParameters,
    onVerify,
  } = props;

  return (
    <Form className={styles.container}>
      <Typography>
        <Subheading className={styles.heading}>
          Design System Source - source space
          <Tag
            tagType={
              appInstallationParameters.sourceConnectionValidated
                ? 'positive'
                : 'secondary'
            }
          >
            {appInstallationParameters.sourceConnectionValidated
              ? 'Connection verified'
              : 'Connection not verified'}
          </Tag>
        </Subheading>
        <Paragraph>
          You need to provide a Space ID and a matching Delivery API Token of a
          space from which you are pulling design system patterns (make sure
          this app is installed in that space as well and specified as a "Design
          system source").
        </Paragraph>
      </Typography>
      <TextField
        labelText="Space ID"
        helpText="ID of a space where you have installed this app as a Design System source"
        id="sourceSpaceId"
        name="sourceSpaceId"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setAppInstallationParameters({
            ...appInstallationParameters,
            sourceSpaceId: e.target.value.trim(),
          });
        }}
        required={true}
        value={appInstallationParameters.sourceSpaceId || ''}
        width="large"
        textInputProps={{
          maxLength: 12,
        }}
      />
      <TextField
        labelText="Delivery API Token"
        helpText="Content Delivery API access token used to authenticated with the source space"
        id="sourceDeliveryToken"
        name="sourceDeliveryToken"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setAppInstallationParameters({
            ...appInstallationParameters,
            sourceDeliveryToken: e.target.value.trim(),
          });
        }}
        required={true}
        value={appInstallationParameters.sourceDeliveryToken || ''}
        width="large"
        textInputProps={{
          type: 'password',
        }}
      />
      <Button onClick={onVerify}>Verify connection</Button>
    </Form>
  );
};

export default SpaceSelector;
