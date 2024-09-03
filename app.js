const express = require("express")
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config();


const dashboardRoutes = require("./src/routes/dashboard.routes");
const kycRoutes = require("./src/routes/kyc.routes");
const currencyRoutes = require("./src/routes/currency.routes");
const orderRoutes = require("./src/routes/orders.routes");
const userRoutes = require('./src/routes/users.routes');
const authRoutes = require('./src/routes/auth.routes');
const walletRoutes = require('./src/routes/wallet.routes');
const ticketRoutes = require('./src/routes/supportTicket.routes');
const transactionRoutes = require('./src/routes/transactions.routes');
const referralsRoutes = require('./src/routes/referrals.routes');
const notificationRoutes = require('./src/routes/notification.routes');

const mode = process.env.MODE;
let dbUser, dbPassword, uri;

if(mode === 'dev'){
  dbUser = process.env.DB_USER_DEV;
  dbPassword = process.env.DB_PASSWORD_DEV;
  uri = `mongodb+srv://${dbUser}:${dbPassword}@deonhub.g1umm8e.mongodb.net/?retryWrites=true&w=majority`
} else {
  dbUser = process.env.DB_USER_PROD;
  dbPassword = process.env.DB_PASSWORD_PROD;
  uri = `mongodb+srv://${dbUser}:${dbPassword}@barterfunds.sykg3.mongodb.net/?retryWrites=true&w=majority`
}




const transporter = require("./src/utils/transporter");
const hostEmail = process.env.HOST_EMAIL;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('Error connecting to MongoDB:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB successfully!');
});

mongoose.Promise = global.Promise;


app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/kycs", kycRoutes);
app.use("/currencies", currencyRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/wallets", walletRoutes);
app.use("/tickets", ticketRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/transactions", transactionRoutes);
app.use("/referrals", referralsRoutes);
app.use("/notifications", notificationRoutes);


app.use((req, res, next) => {
  if (req.url === '/') {
    res.status(200).send('Welcome to BarterFunds API 1.0.0');
  } else {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
  }
});




app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});


app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;