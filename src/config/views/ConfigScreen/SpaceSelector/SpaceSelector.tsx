import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import React from 'react';

import {
  Form,
  Paragraph,
  Subheading,
  TextField,
  Typography,
  Button,
  Tag,
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
          Connect a source space
        </Subheading>
        <Paragraph>
          To set up the Jumpgate app, please provide the Space ID and Content
          Delivery API (CDA) token from your space below. Once the connection
          with the source space is set up, you will be able to map the content
          guidelines you created to content types in this space.
        </Paragraph>
      </Typography>
      <TextField
        labelText="Space ID"
        id="sourceSpaceId"
        name="sourceSpaceId"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setAppInstallationParameters({
            ...appInstallationParameters,
            sourceConnectionValidated: false,
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
        id="sourceDeliveryToken"
        name="sourceDeliveryToken"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setAppInstallationParameters({
            ...appInstallationParameters,
            sourceConnectionValidated: false,
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
      {appInstallationParameters.sourceConnectionValidated ? (
        <Tag tagType="positive">Connection verified</Tag>
      ) : (
        <Button onClick={onVerify}>Verify connection</Button>
      )}
    </Form>
  );
};

export default SpaceSelector;
