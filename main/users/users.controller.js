const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize');
const authorizeAdmin = require('_middleware/authorizeAdmin');
// const userService = require('./user.service');
// const mailService = require('../Email/email.service')
// routes
router.get('/getNotifications', authorizeAdmin(), getNotifications);
router.get('/getNotificationsUser', authorize(), getNotifications);
router.get('/usernotify/:id',  authorize(), getnById );
router.delete('/remove/notify/:id'  , removeNotify)


router.post('/authenticate', authenticateSchema, authenticate);
router.post('/authenticateAdmin', authenticateSchema, authenticateAdmin);
router.post('/register', registerSchema, register);

router.post('/paymentData', paymentData);
router.post('/updatePaymentDetails', updatePaymentDetails);
router.get('/getTransitionstatus/:id' , getTransitionstatus )


router.get('/current', authorizeAdmin(), getCurrent);
router.get('/approve'  , authorizeAdmin()  , getApproved)
router.get('/reject' , getReject)
router.get('/reject_id/:id', rejectListByID);
router.put('/RejectUserSubmit/:id',  RejectuserupdateSchema, Rejectupdate);
router.put('/approveUser/:id', authorizeAdmin(), approveUser  , approveMail);
router.put('/rejectUser/:id', authorizeAdmin() ,rejectUser, rejectMailservice );
router.put('/updateUser/:id', authorize(), userProfileUpdateSchema , userProfileUpdate);
// User Image------------
router.put('/updateUserImage/:id', authorize(), userProfileUpdateSchemaImage , userProfileUpdate);

router.put('/userImg/:id' ,userimageUpdateSchema ,  userimageUpdate)
router.get('/approveusers' , getallapproveusers)

// Role Admin ------------------

router.post('/rolecreate' , roleregisterSchema , roleregister)
router.get('/roleget' , roleGet)
router.put('/roleupdate/:id', roleupdateSchema, roleupdate);



// User By Subadmin------------

router.get('/getBycountry/:id', authorizeAdmin(), getBycountry);
router.get('/approveUsercountry/:id', authorizeAdmin()  , approveUserBycountry)
router.get('/rejectUsercountry/:id', authorizeAdmin()  , rejectUserBycountry)

//#################add above only##################
router.get('/:id', authorize(), getById);
router.get('/getUserProfile/:id', authorize(), getUserProfile);

router.put('/:id', authorize(), updateSchema, update);
router.put('/updatePassword/:id', authorize(), updatePasswordSchema, updatePassword);
router.put('/updatePasswordAdmin/:id', AdminupdatePasswordSchema, AdminupdatePassword);


router.delete('/:id', authorize(), _delete);

router.get('/', authorizeAdmin(), getAll);



module.exports = router;

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => res.json(user))
        .catch(next);
}

function authenticateAdmin(req, res, next) {
    userService.authenticateAdmin(req.body)
        .then(user => res.json(user))
        .catch(next);
}

function registerSchema(req, res, next) {
    req.body.role = "user";
    req.body.password = makeid();
    req.body.approved = 0;

    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        
        password: Joi.string().min(6).required(),

        role:Joi.string(),

        email:Joi.any().required(),
        organization:Joi.any(),
        city:Joi.any(),
        province:Joi.any(),
        areaCode:Joi.any(),
        country_id:Joi.any().required(),
        contactNo:Joi.any().required(),
        officeName:Joi.any(),
        faxNo:Joi.any(),
        mobileNo:Joi.any(),
        mailingAddress:Joi.any(),
        dob:Joi.any().required(),
        gender:Joi.any().required(),
        course_id:Joi.any().required(),
        university_name:Joi.any(),
        qualifying_year:Joi.any(),
        publication_id:Joi.any(),
        award_honor_id:Joi.any().required(),
        achievement_in_transfusion_medicine:Joi.any().required(),
        membership_of_association:Joi.any().required(),
        membership_id:Joi.any().required(),
    });
    validateRequest(req, next, schema);
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    // return text;
    return "123456";
}

function register(req, res, next) {
    userService.create(req.body)
    // userService.create(req.body , req.params.id)
    .then((data) => res.json(data))
    .catch(next);
}
  
function updatePassword(req,res,next){
    userService.updatePassword(req.params.id,req.body)
    .then((data) => res.json(data))
    .catch(next);
}

function getAll(req, res, next) {
    userService.getAll(req.query.page,req.query.limit,req.query.approved)
        .then(users => res.json(users))
        .catch(next);
}

function getApproved(req , res, next) {
    userService.approvedLists(req.query.page,req.query.limit,req.query.approved)
    .then(lists => res.json(lists))
    .catch(next);
}

function getReject(req , res, next) {
    userService.getRejectLists(req.query.page,req.query.limit,req.query.approved)
    .then(lists => res.json(lists))
    .catch(next);
}


function getCurrent(req, res, next) {
    res.json(req.user);
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}

function getUserProfile(req, res, next) {
    userService.getUserProfile(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}

function getallapproveusers(req, res, next) {
    userService.getallapproveusers(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().empty(''),
        password: Joi.string().min(6).empty('')
    });
    validateRequest(req, next, schema);
}

function userProfileUpdateSchema(req, res,next) {
    const schema = Joi.object({
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        organization: Joi.any().empty(''),
        city : Joi.any().empty(''),
        province:Joi.any().empty(''),
        country_id : Joi.any().empty(''),
        contactNo: Joi.any().empty(''),
        mobileNo: Joi.any().empty(''),
        officeName: Joi.any().empty(''),
        dob: Joi.any().empty(''),
        areaCode: Joi.any().empty('')
    });
    validateRequest(req, next , schema)
}

function userProfileUpdate(req, res, next ) {
    userService.userProfileUpdate(req.params.id , req.body)
    .then(user => res.json(user))
    .catch(next);
}

function updatePasswordSchema(req,res,next){

    const schema = Joi.object({
        Confirmpassword: Joi.string().empty(''),
        Oldpassword: Joi.string().empty(''),
        newpassword: Joi.any().empty('')
    });
    validateRequest(req, next , schema)

}

function AdminupdatePasswordSchema(req,res,next){
    const schema = Joi.object({
        Confirmpassword: Joi.string().empty(''),
        Oldpassword: Joi.string().empty(''),
        newpassword: Joi.any().empty('')
    });
    validateRequest(req, next , schema)
}

function AdminupdatePassword(req,res,next){
    userService.AdminupdatePassword(req.params.id,req.body)
    .then((data) => res.json(data))
    .catch(next);
}

function userProfileUpdateSchemaImage(req, res,next) {
    const schema = Joi.object({
        user_img_id: Joi.string().empty('')
    });
    validateRequest(req, next , schema)
}
function paymentData(req, res, next) {
    userService.getPaymentDetails(req.body)
        .then(data => res.json(data))
        .catch(next);
}
function updatePaymentDetails(req, res, next) {
    userService.updatePaymentDetails(req.body)
        .then(data => res.json(data))
        .catch(next);
}

function update(req, res, next) {
  
    userService.update(req.params.id, req.body)
        .then(user => res.json(user))
        .catch(next);
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({ message: 'User deleted successfully' }))
        .catch(next);
}

function approveUser(req, res, next ) {
    userService.approveUser(req.params.id)
    .then((data) => res.json(data))
    .catch(next);
}

function approveMail(req, res, next) {
    userService.approveMail(req.body)
    .then(lists => res.json(lists))
    .catch(next)
}

function rejectUser(req, res, next) {
    userService.rejectUser(req.params.id,req.body.value)
    .then(() => res.json({msg : 'User reject Sucessfully'} ))
    .catch(next);
}

function rejectMailservice(req, res, next) {
    userService.rejectMail(req.body)
    .then(lists => res.json(lists))
    .catch(next)
}

function getNotifications(req,res,next){
    userService.getNotifications(req.user.id)
    .then((list) => res.json(list))
    .catch(next);
}

function removeNotify(req, res, next) {
    userService.removeNotify(req.params.id)
    .then(() => res.json({msg : 'Marked as read'}))
    .catch(next)
}

function rejectListByID (req , res , next) {
    userService.rejectListsById(req.params.id)
    .then((list) => res.json(list))
    .catch(next);
}


function RejectuserupdateSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email:Joi.any().required(),
        organization:Joi.any(),
        city:Joi.any(),
        province:Joi.any(),
        areaCode:Joi.any(),
        country_id:Joi.any().required(),
        contactNo:Joi.any().required(),
        officeName:Joi.any(),
        faxNo:Joi.any(),
        mobileNo:Joi.any(),
        mailingAddress:Joi.any(),
        dob:Joi.any().required(),
        gender:Joi.any().required(),
        course_id:Joi.any().required(),
        university_name:Joi.any(),
        qualifying_year:Joi.any(),
        publication_id:Joi.any(),
        award_honor_id:Joi.any().required(),
        achievement_in_transfusion_medicine:Joi.any().required(),
        membership_of_association:Joi.any().required(),
    });
    validateRequest(req, next, schema);
}


function Rejectupdate(req, res, next) {
    userService.Rejectupdate(req.params.id, req.body)
        .then(() => res.json({message : "Success"}))
        .catch(next);
}






function getnById (req , res , next) {
    userService.getNotificationsById(req.params.id)
    .then((list) => res.json(list))
    .catch(next);
}


function userimageUpdateSchema(req, res,next) {
    const schema = Joi.object({
        user_img_id: Joi.any().empty(''),
    });
    validateRequest(req, next , schema)
}

function userimageUpdate(req, res, next ) {
    userService.userimageUpdate(req.params.id , req.body)
    .then(() => res.json({msg : 'Image Upload Sucessfully'}))
    .catch(next);
}

function getBycountry(req , res, next){
    userService.getBycountry(req.params.id)
    .then((list) => res.json(list))
    .catch(next);
}
function approveUserBycountry(req, res, next) {
    userService.approveUserBycountry(req.params.id)
        .then(data => res.json(data))
        .catch(next);
}
function rejectUserBycountry(req, res, next) {
    userService.rejectUserBycountry(req.params.id)
        .then(data => res.json(data))
        .catch(next);
}


function getTransitionstatus(req, res, next) {
    userService.getTransitionstatus(req.params.id)
        .then(user => res.json(user))
        .catch(next);
}

function roleregister(req, res, next) {
    userService.rolecreate(req.body)
    .then((data) => res.json(data))
    .catch(next);
}

function roleregisterSchema(req, res, next) {
    req.body.role = "subadmin";
    req.body.approved = 1;

    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        
        password: Joi.string().min(6).required(),

        role:Joi.string(),

        email:Joi.any().required(),
        organization:Joi.any(),
        city:Joi.any(),
        province:Joi.any(),
        areaCode:Joi.any(),
        country_id:Joi.any().required(),
        contactNo:Joi.any().required(),
        officeName:Joi.any(),
        faxNo:Joi.any(),
        mobileNo:Joi.any(),
        mailingAddress:Joi.any(),
        dob:Joi.any(),
        gender:Joi.any(),
        course_id:Joi.any(),
        university_name:Joi.any(),
        qualifying_year:0,
        publication_id: 0,
        award_honor_id: 0,
        achievement_in_transfusion_medicine: 0,
        membership_of_association: 0,
        membership_id: 0,
    });

    validateRequest(req, next, schema);
}

function roleGet(req, res, next) {
    userService.roleGet(req.user)
        .then(lists => res.json(lists))
        .catch(next);
}
function roleupdateSchema(req,res,next){
    const schema = Joi.object({
        approved: Joi.any().empty(''),
    });
    validateRequest(req, next , schema)
}

function roleupdate(req,res,next){
    userService.roleupdate(req.params.id,req.body)
    .then(() => res.json({message: "Subadmin Deactived Sucessfully."}))
    .catch(next);
}
