Jumpgate app

# Installing the app in your Contentful space

## Self-hosting the app

In case you need to make changes to the app that are specific to your organization, you can do it by forking this repository, and then hosting it on any static host like Vercel or Netlify. Most of them offer a free plan and it's enough to just connect your fork of this repository to a project created on a hosting provider of your choice.

## Scripted installation

The app comes with a script to install the app in your space. The script does the following:

- Create a new app definition in your organization
- Creates a new app installation in your space

To run the script, you need to have the following:

- A Contentful space ID
- Contentful management token (you can generate one [here](https://app.contentful.com/account/profile/cma_tokens))

Note: If you are self hosting the app, you will want to change the app url of the app definition that the script will use. To do that, create a new file called `.env` in the top level folder of this repository and add the following to it:

```
APP_URL=https://your.host.com
```

Replace `https://your.host.com` with whatever URL your hosting provider gives you.

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
Set App URL to `https://jumpgate.vercel.app` or to a URL of your self-hosted app and check "App configuration screen" and "Entry editor" boxes in the Location field, and then click Create.

Go to the Contentful space where you wish to install the app, and then go to Apps -> Manage apps. You should see your app available for installation under the "Available" list. Click on it and proceed with configuring the app.
