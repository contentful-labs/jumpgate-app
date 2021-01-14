import { Asset } from 'contentful';
import { EditorExtensionSDK } from 'contentful-ui-extensions-sdk';
import { useEffect, useMemo, useState } from 'react';

import {
  getExternalSourceAsset,
  getSourceAsset,
} from '../../config/getSourceDesignSystemPatterns';
import { AppInstallationParameters } from '../../types';
import getEntryFieldValue from '../../utils/getEntryFieldValue';

interface LazyAssetProps {
  id: string;
  sdk: EditorExtensionSDK;
}

const LazyAsset: React.FC<LazyAssetProps> = (props) => {
  const { id, sdk } = props;
  const installationParameters = sdk.parameters
    .installation as AppInstallationParameters;

  const [asset, setAsset] = useState<Asset>();

  useEffect(() => {
    (async () => {
      if (asset !== undefined) {
        return;
      }

      let loadedAsset = null;

      if (installationParameters.spaceType === 'consumer') {
        loadedAsset = await getExternalSourceAsset(
          installationParameters.sourceSpaceId!,
          installationParameters.sourceDeliveryToken!,
          id,
        );
      } else if (installationParameters.spaceType === 'sourceandconsumer') {
        loadedAsset = await getSourceAsset(sdk, id);
      }

      if (loadedAsset === null) {
        return;
      }

      setAsset(loadedAsset);
    })();
  }, [id, asset, sdk, installationParameters]);

  const file = useMemo(() => {
    if (asset === undefined) {
      return undefined;
    }

    return getEntryFieldValue(
      asset.fields.file,
      asset.sys.locale || sdk.locales.default,
    );
  }, [asset, sdk.locales.default]);

  if (asset === undefined || file === undefined) {
    return null;
  }

  return (
    <figure>
      <img
        src={file.url}
        alt={getEntryFieldValue(
          asset.fields.title,
          asset.sys.locale || sdk.locales.default,
        )}
        width={file.details.image.width}
        height={file.details.image.height}
      />
      <figcaption>
        {getEntryFieldValue(
          asset.fields.description,
          asset.sys.locale || sdk.locales.default,
        )}
      </figcaption>
    </figure>
  );
};

export default LazyAsset;
