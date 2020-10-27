import {
  AppExtensionSDK,
  EditorExtensionSDK,
  BaseExtensionSDK,
  init,
  locations,
} from 'contentful-ui-extensions-sdk';
import React from 'react';
import { render } from 'react-dom';

import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import '@contentful/forma-36-tokens/dist/css/index.css';
import './index.css';

import Config from './config/views/ConfigScreen/ConfigScreen';
import EntryEditor from './entry-editor/views/EntryEditorScreen/EntryEditorScreen';

init((sdk: BaseExtensionSDK) => {
  const root = document.getElementById('root');

  const ComponentLocationSettings = [
    {
      location: locations.LOCATION_APP_CONFIG,
      component: <Config sdk={(sdk as unknown) as AppExtensionSDK} />,
    },
    {
      location: locations.LOCATION_ENTRY_EDITOR,
      component: <EntryEditor sdk={(sdk as unknown) as EditorExtensionSDK} />,
    },
  ];

  ComponentLocationSettings.forEach((componentLocationSetting) => {
    if (sdk.location.is(componentLocationSetting.location)) {
      render(componentLocationSetting.component, root);
    }
  });
});
