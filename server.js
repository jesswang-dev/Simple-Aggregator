import express from 'express';
import controllers from './controllers.js';
const app = express();
const port = 3000;



/**
 * Handle parsing request body
 */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// app.use('/', (req, res) => {
//     res.status(200).json("Hello World");
// })


/**
 * route handle the user request with id, and timestampA and timestampB
 */

app.use('/serverless', controllers.requestData, controllers.countHourly, (req, res) => {
    res.status(200).json(res.locals.result);
})

app.use('/sqlite', controllers.requestDataLocal, controllers.countHourly, (req, res) => {
    res.status(200).json(res.locals.result);
})
/**
 * Handle the unkown routes
 */
app.use((req, res) => {
    res.status(404).json('404 Cannot find the page');
})

/**
 * Global Error Handler, handling error in the middlewares
 */

app.use((err, req, res, next) => {
    const defaultErr = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: { err: 'An error occurred' },
  };

  const errorObj = Object.assign(defaultErr, err);
  return res.status(errorObj.status).json(errorObj.message);

})


app.listen(port, () => {
    console.log(`Sever is listening on port ${port}`);
})