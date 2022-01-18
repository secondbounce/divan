import { JSON_STRINGIFY_SPACES } from '../constants';

/** Converts value to string using `JSON.stringify()` */
export function stringify(value: any): string {
  return JSON.stringify(decycle(value), undefined, JSON_STRINGIFY_SPACES);
}

export function convertToText(obj: any): string {
  return convertObjectToText(decycle(obj), 0);
}

function convertObjectToText(obj: any, indent: number = 0): string {
  const text: string[] = [];
  const thisIndent: string = ' '.repeat(indent);
  indent += JSON_STRINGIFY_SPACES;
  const nextIndent: string = ' '.repeat(indent);

  if (typeof(obj) === 'undefined' || obj === null) {
    return String(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(element => {
      text.push(convertObjectToText(element, indent));
    });

    return text.length === 0 ? '[]'
                             : '[\n' + nextIndent + text.join(',\n' + nextIndent) + '\n' + thisIndent + ']';
  } else if (typeof(obj) === 'function') {
    text.push(obj.toString());

  } else if (typeof(obj) === 'object') {
    Object.getOwnPropertyNames(obj)
          .forEach((property) => text.push(property + ': ' + convertObjectToText(obj[property], indent)));

    return text.length === 0 ? '{}'
                             : '{\n' + nextIndent + text.join(',\n' + nextIndent) + '\n' + thisIndent + '}';
  } else {
    text.push(JSON.stringify(obj, undefined, JSON_STRINGIFY_SPACES));
  }

  return text.join(',\n' + nextIndent);
}

/**
 * This method removes any circular references in the object, allowing it to be
 * serialized to JSON.
 * Taken from https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 */
function decycle(object: any): any {
  // Make a deep copy of an object or array, assuring that there is at most
  // one instance of each object or array in the resulting structure. The
  // duplicate references (which might be forming cycles) are replaced with
  // an object of the form
  //      {"$ref": PATH}
  // where the PATH is a JSONPath string that locates the first occurance.
  // So,
  //      var a = [];
  //      a[0] = a;
  //      return JSON.stringify(JSON.decycle(a));
  // produces the string '[{"$ref":"$"}]'.
  // If a replacer function is provided, then it will be called for each value.
  // A replacer function receives a value and returns a replacement value.
  // JSONPath is used to locate the unique object. $ indicates the top level of
  // the object or array. [NUMBER] or [STRING] indicates a child element or
  // property.
  const objects: WeakMap<any, string> = new WeakMap();     // object to path mappings

  return (function derez(value: any, path: string): any {
    // The derez function recurses through the object, producing the deep copy.
    let old_path: string | undefined;   // The path of an earlier occurance of value
    let nu: any;         // The new object or array

    // typeof null === "object", so go on if this value is really an object but not
    // one of the weird builtin objects.
    if (typeof value === 'object'
        && value !== null
        && !(value instanceof Boolean)
        && !(value instanceof Date)
        && !(value instanceof Number)
        && !(value instanceof RegExp)
        && !(value instanceof String)
      ) {

      // If the value is an object or array, look to see if we have already
      // encountered it. If so, return a {"$ref":PATH} object. This uses an
      // ES6 WeakMap.
      old_path = objects.get(value);
      if (old_path !== undefined) {
        return { $ref: old_path };
      }

      // Otherwise, accumulate the unique value and its path.
      objects.set(value, path);

      // If it is an array, replicate the array.
      if (Array.isArray(value)) {
        nu = [];
        value.forEach(function(element, i) {
          nu[i] = derez(element, path + '[' + i + ']');
        });
      } else {
        // If it is an object, replicate the object.
        nu = {};
        Object.getOwnPropertyNames(value).forEach(function(name) {
          nu[name] = derez(
            value[name],
            path + '[' + JSON.stringify(name) + ']'
          );
        });
      }
      return nu;
    }
    return value;
  }(object, '$'));
}
