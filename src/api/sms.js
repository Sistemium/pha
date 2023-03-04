import { axiosInstance } from 'sistemium-data/src/util/axios';
import qs from 'qs';
import trim from 'lodash/trim';
import log from 'sistemium-debug';
const AWS = require('aws-sdk');

const { debug, error } = log('sms');

const {
  SMS_URL,
  SMS_LOGIN,
  SMS_PASSWORD,
  SMS_ORIGIN = 'Sistemium',
  SMS_PREFIX,
  AWS_LOGIN,
  AWS_PASSWORD,
  AWS_REGION
} = process.env;

const axios = axiosInstance({});

if (AWS_LOGIN && AWS_PASSWORD) {
  AWS.config.update({
    accessKeyId: AWS_LOGIN,
    secretAccessKey: AWS_PASSWORD,
    region: AWS_REGION
  });
}

const sns = new AWS.SNS();

export default async function(mobileNumber, code) {

  const options = {
    Message: trim(`${SMS_PREFIX} ${code}`),
    MessageStructure: 'string',
    PhoneNumber: mobileNumber,
    MessageAttributes:{
      'AWS.SNS.SMS.SenderID': {
        'DataType': 'String',
        'StringValue': SMS_ORIGIN,
      }
    }
  };

  await sns.publish(options).promise();

}

export async function smsTraffic(mobileNumber, code) {

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
