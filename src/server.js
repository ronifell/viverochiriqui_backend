'use strict';

const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[viverochiriqui] API listening on http://localhost:${env.PORT} (env=${env.NODE_ENV})`
  );
});
