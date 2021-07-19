import Koa from 'koa';
import koaBody from 'koa-bodyparser';
import logger from 'koa-logger';
import router from './router';
import assert from 'sistemium-mongo/lib/assert';
import log from 'sistemium-debug';

import { connect } from '../models';

const { PORT } = process.env;
const app = new Koa();
const { debug } = log('api');


app
  .use(logger())
  .use(koaBody())
  .use(router.routes());

if (require.main === module) {

  assert(PORT, 'PORT must be specified');

  connect()
    .then(() => {
      app.listen(PORT);
      debug('PORT', PORT);
    });

}

export default app;
