const catchify = require('catchify');
const { createClient } = require('contentful-management');

const APP_URL = process.env.APP_URL || 'https://jumpgate.vercel.app';

const installAppToSpace = async ({ cmaToken, spaceId }) => {
  const client = createClient({
    accessToken: cmaToken,
  });

  // Check the validity of the CMA token
  const [currentUserError] = await catchify(client.getCurrentUser());

  if (currentUserError) {
    console.error(currentUserError);

    if (currentUserError.name === 'AccessTokenInvalid') {
      return {
        state: 'error',
        error:
          'The token you have provided could not be found, or is invalid. Double check that you have provided a correct access token.',
      };
    }

    return {
      state: 'error',
      error: `There was an issue with calling the Contentful management API: ${currentUserError.name}`,
    };
  }

  // Get space org info
  const getSpaceOrgStartTime = new Date();
  console.info('Getting space organization info...');

  const [spaceError, space] = await catchify(client.getSpace(spaceId));

  if (spaceError !== null) {
    console.error(spaceError);
    return {
      state: 'error',
      error:
        'Failed to get space info, check that you have provided the right spaceId argument',
    };
  }

  const orgId = space.sys.organization.sys.id;

  const getSpaceOrgEndTime = new Date();

  console.info(
    `Got space organization info. Done in ${Math.round(
      (getSpaceOrgEndTime.getTime() - getSpaceOrgStartTime.getTime()) / 1000,
    )}s`,
  );

  // Get app definitions available
  const getAppDefinitionsStartTime = new Date();
  console.info('Getting the app definitions...');

  const [appDefinitionsError, appDefinitions] = await catchify(
    client.rawRequest({
      method: 'GET',
      url: `https://api.contentful.com/organizations/${orgId}/app_definitions`,
    }),
  );

  if (appDefinitionsError !== null) {
    console.error(appDefinitionsError);
    return {
      state: 'error',
      error:
        'Failed to get organization app definitions. Are you sure you have the rights to manage apps in this organization?',
    };
  }

  const getAppDefinitionsEndTime = new Date();

  console.info(
    `Got app definitions. Done in ${Math.round(
      (getAppDefinitionsEndTime.getTime() -
        getAppDefinitionsStartTime.getTime()) /
        1000,
    )}s`,
  );

  // If not already present, create an app definition
  let appDefinitionId;
  const existingAppDefinition = appDefinitions.items.find((appDefinition) =>
    appDefinition.src.startsWith(APP_URL),
  );

  if (existingAppDefinition !== undefined) {
    appDefinitionId = existingAppDefinition.sys.id;
  } else {
    // Create a new app definition
    const createAppDefinitionStartTime = new Date();
    console.info(
      'No existing app definition found, creating a new app definition...',
    );

    const [createAppDefinitionError, createAppDefinition] = await catchify(
      client.rawRequest({
        method: 'POST',
        url: `https://api.contentful.com/organizations/${orgId}/app_definitions`,
        data: {
          name: 'Jumpgate',
          src: APP_URL,
          locations: [
            {
              location: 'app-config',
            },
            {
              location: 'entry-editor',
            },
          ],
        },
      }),
    );

    if (createAppDefinitionError !== null) {
      console.error(createAppDefinitionError);
      return {
        state: 'error',
        error:
          'Failed to get create new app definition. Are you sure you have the rights to manage apps in this organization?',
      };
    }

    appDefinitionId = createAppDefinition.sys.id;

    const createAppDefinitionEndTime = new Date();

    console.info(
      `New app definition created. Done in ${Math.round(
        (createAppDefinitionEndTime.getTime() -
          createAppDefinitionStartTime.getTime()) /
          1000,
      )}s`,
    );
  }

  // Install the app
  const installTheAppStartTime = new Date();
  console.info('Installing the app...');

  const [installTheAppError, installTheApp] = await catchify(
    client.rawRequest({
      method: 'PUT',
      url: `https://api.contentful.com/spaces/${spaceId}/app_installations/${appDefinitionId}`,
      data: {
        parameters: {},
      },
      headers: {
        'X-Contentful-Marketplace':
          'i-accept-end-user-license-agreement,i-accept-marketplace-terms-of-service,i-accept-privacy-policy',
      },
    }),
  );

  if (installTheAppError !== null) {
    console.error(installTheAppError);
    return {
      state: 'error',
      error: 'Failed to install the app into the space',
    };
  }

  const installTheAppEndTime = new Date();

  console.info(
    `App installed. Done in ${Math.round(
      (installTheAppEndTime.getTime() - installTheAppStartTime.getTime()) /
        1000,
    )}s`,
  );

  return {
    state: 'success',
  };
};

module.exports = installAppToSpace;
