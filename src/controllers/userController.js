const User = require('../models/user');

exports.handleLoginRequest = (userData, res, response) => {
  const { access_token } = response
  const { phoneNumber } = userData
  return User.findOneAndUpdate({ phoneNumber }, userData, { upsert: true })
    .then(user => res.json({ user, access_token, success: true }))
    .catch(error => res.json({ error, success: false }))
};

exports.postLogin = (req, res) => {
  const { phoneNumber, name, licensePlate, make, model, color, available, verificationCode } = req.body
  const {signIn} = req.app.auth0.passwordless		
  const data = { username: phoneNumber, password: verificationCode };

  signIn(data, (error, response) => {
    if (error) return res.json({ error, success: false });
    const userData = { 
      phoneNumber, 
      name, 
      licensePlate, 
      available,
      responding: false,
      car: { make, model, color },
    };
    return handleLoginRequest(userData, res, response)
  });
};


exports.logout = (req, res) => {

};
exports.postSignup = (req, res) => {
  const data = {
    phone_number: req.body.phoneNumber,
  };
  req.app.auth0.passwordless.sendSMS(data, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err,
      });
    }
    return res.json({
      success: true,
    });
  });
};

exports.updateUser = (req, res) => {
  if (`+${req.params.id}` !== req.user.phoneNumber) {
    res.json({
      success: false,
      error: 'you are updating the wrong user',
    });
  }
  return User.findOneAndUpdate({ phoneNumber: req.user.phoneNumber }, req.body, { new: true, upsert: true })
    .then((user) => {
      res.json({
        success: true,
        user,
      });
    });
};

exports.getUser = (req, res) => {
  res.json(req.user);
};
