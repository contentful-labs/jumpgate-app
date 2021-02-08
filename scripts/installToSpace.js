const yargs = require('yargs');

const installToSpace = require('./install/installToSpace');

require('dotenv').config();

const { argv } = yargs
  .options({
    cmaToken: {
      type: 'string',
      describe:
        'Content management token - You can generate on here: https://app.contentful.com/account/profile/cma_tokens',
    },
    spaceId: {
      type: 'string',
      describe: 'ID of the target space',
    },
  })
  .demandOption(
    ['cmaToken', 'spaceId'],
    'Please provide cmaToken and spaceId arguments',
  );

const startTime = new Date();

installToSpace({
  cmaToken: argv.cmaToken,
  spaceId: argv.spaceId,
})
  .then((result) => {
    if (result.state !== 'error') {
      return;
    }

    console.info(
      'Jumpgate script failed with the following error:',
      result.error,
    );
  })
  .then(() => {
    const endTime = new Date();

    console.info(
      `Jumpgate successfully installed and configured. Your new app awaits you at https://app.contentful.com/spaces/${
        argv.spaceId
      }/apps Done in ${Math.round(
        (endTime.getTime() - startTime.getTime()) / 1000,
      )}s`,
    );
  })
  .catch((e) => {
    console.info('Jumpgate script failed with the following error:');
    console.error(e);
  });
