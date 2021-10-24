const httpStatus = require('http-status');
const ApiError = require('./ApiError');
const raiseNotFound = (obj) => {
  if(!obj){
    throw new ApiError(httpStatus.NOT_FOUND,'Could not find the requested entity');
  }
  return obj;
}
module.exports=raiseNotFound;
