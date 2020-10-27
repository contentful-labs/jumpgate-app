// Entry fields are sometimes objects (localized) and sometimes not
const getEntryFieldValue = (field: any, defaultLocale: string) => {
  if (typeof field === 'string') {
    return field;
  }

  if (typeof field[defaultLocale] !== 'undefined') {
    return field[defaultLocale];
  }

  return field;
};

export default getEntryFieldValue;
