const User = require('../models/user');

const handleLoginRequest = exports.handleLoginRequest = (userData, res, response) => {
  const { access_token } = response;
  const { phoneNumber } = userData;
  return User.findOneAndUpdate({ phoneNumber }, userData, { upsert: true })
    .then(user => {
      const updatedUser = Object.assign(user.toJSON(), { token: access_token });
      res.json({ user: updatedUser, access_token, success: true })
    })
    .catch(error => res.json({ error, success: false }));
};


exports.getUser = (req, res) => {
  const phoneNumber = req.params.id;
  User.findOne({
      phoneNumber,
    }, (err, doc) => {
      if (err) {
        return res.json({
          success: false,
          err,
        });
      }
      return res.json(doc);
    });
};

exports.postLogin = (req, res) => {
  const { phoneNumber, name, licensePlate, make, model, color, available, verificationCode } = req.body;
  const data = { username: phoneNumber, password: verificationCode };

  req.app.auth0.passwordless.signIn(data, (error, response) => {
    if (error) return res.json({ error, success: false });
    const userData = {
      phoneNumber,
      name,
      licensePlate,
      available,
      responding: false,
      car: { make, model, color },
    };
    return handleLoginRequest(userData, res, response);
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
  if (`+1${req.params.id}` !== req.body.phoneNumber) {
    res.json({
      success: false,
      error: 'you are updating the wrong user',
    });
  }
  const { phoneNumber, name, licensePlate, car, available, location, token } = req.body;
  let updatedLocation = location;
  if (!location) {
    updatedLocation = [0, 0];
  }
  const doc = {
    phoneNumber,
    name,
    licensePlate,
    available,
    responding: false,
    car,
    location: updatedLocation,
  };
  User.findOneAndUpdate({ phoneNumber: req.body.phoneNumber }, doc, { new: true, upsert: true })
    .then((user) => {
      const updatedUser = Object.assign(user.toJSON(), { token });
      res.json({
        success: true,
        user: updatedUser,
      });
    })
    .catch(error => res.json({ error, success: false }));
};

exports.getUser = (req, res) => {
  res.json(req.user);
};
