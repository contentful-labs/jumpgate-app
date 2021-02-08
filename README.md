Jumpgate app

# Installing the app in your Contentful space

## Scripted installation

The app comes with a script to install the app in your space. The script does the following:

- Create a new app definition in your organization
- Creates a new app installation in your space

To run the script, you need to have the following:

- A Contentful space ID
- Contentful management token (you can generate one [here](https://app.contentful.com/account/profile/cma_tokens))

Note: In order for script to work, you need to have permissiosn to create app definitions in the organization your space belongs to

### Running the script

After cloning this repo, run `npm install` and wait for the dependencies to install. Then, run the following command:

```
npm run installToSpace -- --spaceId="<SPACE_ID>" --cmaToken="<MANAGEMENT_TOKEN>"
```

Replace the `<SPACE_ID>` and `<MANAGEMENT_TOKEN>` placeholders with actual space ID and management token.

The script should take ~2 seconds to finish. After finishing, you can go to your Contentful space and you should see the app installed there. Proceed with configuring the app.

## Manual installation

The app can also be added to your organization/space manually. In Contentful, go to Organization settings -> Apps and click on Create app.

Fill the Name field as you wish (tip: whatever you put here will show up as a title of an entry editor tab on content types that have guidelines assigned).
Set App URL to `https://jumpgate.vercel.app` and check "App configuration screen" and "Entry editor" boxes in the Location field, and then click Create.

Go to the Contentful space where you wish to install the app, and then go to Apps -> Manage apps. You should see your app available for installation under the "Available" list. Click on it and proceed with configuring the app.
