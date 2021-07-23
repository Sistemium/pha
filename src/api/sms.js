import { axiosInstance } from 'sistemium-data/src/util/axios';
import qs from 'qs';
import trim from 'lodash/trim';
import log from 'sistemium-debug'

const { debug, error } = log('sms');

const {
  SMS_URL,
  SMS_LOGIN,
  SMS_PASSWORD,
  SMS_ORIGIN = 'Sistemium',
  SMS_PREFIX,
} = process.env;

const axios = axiosInstance({});

export default async function (mobileNumber, code) {

  const data = {
    login: SMS_LOGIN,
    password: SMS_PASSWORD,
    originator: SMS_ORIGIN,
    message: trim(`${SMS_PREFIX} ${code}`),
    rus: 5,
    phones: mobileNumber,
  };

  const options = {
    url: SMS_URL,
    method: 'POST',
    data: qs.stringify(data),
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  };

  const { data: response } = await axios(options);

  if (/ERROR/.test(response)) {
    error(response);
    throw new Error('SMS sending error');
  }

  debug(response);

}
