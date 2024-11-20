/**
 *
 * This function parses and stringifys an object and
 * converts Bigints to regular numbers.
 * This hack fixes the output of prisma when you want to
 * deliver it as json.
 *
 * @param param Any object really
 */
export const customJson = (param: any): any => {
  return JSON.stringify(
    param,
    (key, value) =>
      typeof value === "bigint" ? parseInt(value.toString()) : value, // return everything else unchanged
  );
};
