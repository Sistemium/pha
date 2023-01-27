import randomatic from 'randomatic';

/**
 *
 * @param {string}pattern
 * @param {number}length
 * @param {object}[options]
 * @return {String}
 */

export default function randomString(pattern, length, options) {
  const { suffix } = options;
  const random = randomatic(pattern, length, options);
  return `${random}${suffix || ''}`;
}
