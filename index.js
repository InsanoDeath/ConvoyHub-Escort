require('dotenv').config()
const db = require("croxydb")

// EXPRESS INTIALIZE
const express = require("./src/express")
const Express = new express;
Express.init(db)