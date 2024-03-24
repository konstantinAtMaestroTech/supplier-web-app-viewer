module.exports = function(io) {
    const express = require('express');
    let router = express.Router();

    router.post('/assemblyID', async function (req, res, next) { 
        try {
            // Emit an event to the client
            io.emit('assemblyID event', req.body );
            res.status(200).send('OK');
        } catch (err) {
            next(err);
        }
    });
    return router;
}