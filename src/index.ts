import * as path from 'path';

import * as express from "express";

import { VHandler, VEvent } from "vig";


const event = VEvent.getInstance();
let scope;



const app = express();
app.enable("trust proxy 1");


const realPath = path.resolve(__dirname, "./wallet");

const handler = new VHandler(undefined, realPath);

handler.attach(app);


