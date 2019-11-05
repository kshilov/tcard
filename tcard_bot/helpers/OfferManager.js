'use strict';

const {QueueStatus, QueueType, SETUP_STEPS} = require("../helpers/constants");

const logger = require('./logger')


class OfferManager {
    constructor(db){
        this.db = db;
    }

}

module.exports = OfferManager;