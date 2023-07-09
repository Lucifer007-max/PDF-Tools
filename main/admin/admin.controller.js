const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const authorizeAdmin = require('_middleware/authorizeAdmin');
const adminService = require('./admin.service');

//routes
router.post('/role' , roleSchema , roleCreate  )
router.get( '/adminprofile' , authorizeAdmin() , AdminGetById)

module.exports = router;



function roleSchema(req, res, next) {
    const schema = Joi.object({
        roleName: Joi.any()
    });
    validateRequest(req, next, schema);
}

function roleCreate(req, res, next) {
    adminService.rolecreate(req.body)
        .then(() => res.json({ message: 'Role Added Sucessfull' }))
        .catch(next);
}
function AdminGetById (req , res, next) {
    adminService.adminGetById(req.params.role)
    .then(lists => res.json(lists))
    .catch(next)
}