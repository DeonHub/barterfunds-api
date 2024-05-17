const app = require('./app');
require('dotenv').config();

const port = process.env.PORT || 8000;

// Use port and dbUrl as needed in your application
app.listen(port, () => {
  console.log('Server running on port 8000');
});