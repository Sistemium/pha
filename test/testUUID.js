import { v4 } from 'uuid';
import toHex from 'uuid-to-hex';
import { expect } from 'chai';
import chi2gof from '@stdlib/stats/chi2gof';

const UUIDS_NUMBER = 160000;

describe('UUID strength', function () {

  it('should check xi squared', function () {

    this.timeout(10000);

    const test1 = pearsonTest(UUIDS_NUMBER, randomBytes, { alpha: 0.01 });
    console.log('test1:', test1.pValue, test1.statistic);
    expect(test1.rejected)
      .to.be.false;

    const test2 = pearsonTest(UUIDS_NUMBER, () => randomBytes(254), { alpha: 0.05 });
    console.log('test2:', test2.pValue, test2.statistic);
    expect(test2.rejected)
      .to.be.true;

  });

});

function randomBytes(max = 255) {
  const res = new Array(16)
    .fill(0)
    .map(() => Math.round(Math.random() * max));
  return Buffer.from(res);
}

/**
 * @param {number} uuids
 * @param {function} [rng]
 * @param {object} [params]
 * @return {import('@stdlib/stats/chi2gof').Results}
 */
function pearsonTest(uuids, rng, params = {}) {

  const sample = generateUuid(rng);
  const { length } = sample;

  console.log('sample:', sample, 'length:', length);

  const counts = new Array(length)
    .fill(0);

  for (let step = 1; step <= uuids; step += 1) {
    const hexString = generateUuid(rng);
    for (let position = 0; position < length; position += 1) {
      const nibble = parseInt(hexString[position], 16);
      for (let bit = 0; bit < 4; bit += 1) {
        if ((nibble >> bit) & 1) {
          counts[position] += 1;
        }
      }
    }
  }

  /**
   * Array with average counts of 1's for given number of uuids
   * @type {number[]}
   */
  const expected = new Array(length)
    .fill(0)
    .map(() => uuids * 2);

  return chi2gof(counts, expected, params);

}


/**
 * Returns hex string with V4 UUID without 7th byte that is always 4
 * @param [rng] optional array of 16 bytes
 * @return {string}
 */

function generateUuid(rng) {
  const result = toHex(v4({ rng }))
    .split('');
  result.splice(12, 1);
  return result.join('');
}


/**
 * Unused function that calculates the ch-square statistic
 * @param {Array} observed
 * @param {Array} expected
 * @return {{statistic: number, degreesOfFreedom: number}}
 */

function chi2Stat(observed, expected) {
  let statistic = 0;
  for (let i = 0; i < observed.length; i++) {
    const diff = observed[i] - expected[i];
    statistic += diff * diff / expected[i];
  }
  return {
    statistic,
    degreesOfFreedom: observed.length - 1,
  };
}
