import * as crypto from 'crypto';

/**
 * @returns true if the arrays contain the same string values, ignoring the array order
 */
export function isEqualStringArrays(array1: string[], array2: string[]): boolean {
  return array1
      && array2
      && (array1.length === array2.length)
      && (array1.filter(item => !array2.includes(item)).length === 0);
}

/**
 * @param format String format using numeric placeholders - {0}, {1}, etc - for the location
 * of each argument in the output.
 */
export function stringFormat(format: string, ...args: any[] ): string {
  return format.replace(/(?<!\\){(\d+)}/g, (_match, index) => {
                  const arg: any = args[index];
                  return typeof(arg) === 'undefined' ? ''
                                                     : (arg instanceof Date ? arg.toLocaleDateString()
                                                                            : arg);
                })
               .replace('\\{', '{');
}

export function getSha1HashValue(source: string): string {
  let hash: string = '';

  if (source.length > 0) {
    hash = crypto.createHash('sha1')
                 .update(source)
                 .digest('hex');
  }

  return hash;
}
