const app = require('./app');
require('dotenv').config();

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Student result API listening on port ${port}`);
});
