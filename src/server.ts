import express, {Express, Request, Response, NextFunction} from 'express';
import controllers from '../controllers.js';
const app: Express = express();
const port = 3000;



/**
 * Handle parsing request body
 */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



/**
 * route handle the user request with id, and timestampA and timestampB
 */

/**
 * route /sqlite, connect with local events.db
 */

app.use('/sqlite', controllers.requestDataLocal, controllers.countHourly, (req: Request, res: Response) => {
    res.status(200).json(res.locals.result);
})

/**
 * route /serverless, connect with neon service
 */

app.use('/serverless', controllers.requestData, controllers.countHourly, (req: Request, res:Response) => {
    res.status(200).json(res.locals.result);
})

/**
 * Handle the unkown routes
 */
app.use((req: Request, res:Response) => {
    res.status(404).json('404 cannot find result');
})

/**
 * Global Error Handler, handling error in the middlewares
 */

app.use((err: Error, req: Request, res: Response , next: NextFunction) => {
    const defaultErr = {
    log: 'Express error handler caught unknown middleware error',
    status: 400,
    message: { err: 'An error occurred' },
  };

  const errorObj = Object.assign(defaultErr, err);
  return res.status(errorObj.status).json(errorObj.message);

})


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})