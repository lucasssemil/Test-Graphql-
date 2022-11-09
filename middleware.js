var { unless } = require("express-unless");

module.exports = function (middlewareOptions) {
  var mymid = function (req, res, next) {};

  mymid.unless = unless;

  return mymid;
};