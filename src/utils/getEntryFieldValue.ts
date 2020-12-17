// Entry fields are sometimes objects (localized) and sometimes not
const getEntryFieldValue = (field: any, defaultLocale: string): any => {
  if (field === undefined) {
    return undefined;
  }

  if (typeof field === 'string') {
    return field;
  }

  if (typeof field[defaultLocale] !== 'undefined') {
    return field[defaultLocale];
  }

  return field;
};

export default getEntryFieldValue;
