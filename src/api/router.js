import Router from '@koa/router';
import * as account from './account';
import auth from './auth';

const router = new Router();

router
  .get('/account', account.getAccounts)
  .get('/account/:id', account.getOne)
  .put('/account/:id', account.updateOne)
  .post('/account', account.createAccount)
  .delete('/account/:id', account.deleteOne)
;

router.post('/auth', auth);

export default router;
