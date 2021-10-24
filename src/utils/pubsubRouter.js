const logger = require('../config/logger');
const _=require('lodash')
const asynclib= require('async') 
const PubSubError = require('../utils/PubSubError');

const ALLOWED_METHODS = ['push','pull','publish','subscribe'];
const defaultPushHandler=(req,push) => {
  push(req);
} 

const _validateMethod= (method) => {
  if(!_.includes(ALLOWED_METHODS,method)){
    throw new Error(`Invalid method ${method}`);
  }
}

const _validatePath = (path) => {
  if(!path || !(/^[a-zA-Z0-9._*]+$/.test(path))){
    throw new Error(`${path} is not valid path.Only alpanumeric,dot,underscore allowed`);
  }
}

const _createRequest = (path,payload)=>{
  return {
    path,
    payload
  }
}

class PubSubRouter {
  constructor(){
    this.routes = [];
    this.clients = {};
    this.paths={};
  }
  registerClients(clients){
    for(const [key,value] of Object.entries(clients)){
      this.addClient(key,value);
    }
  }
  addClient(method,client){
    _validateMethod(method);
    if(this.clients[method] && this.clients[method]!==client){
      throw new Error(`Cannot add multiple client for method ${method}`)
    }
    this.clients[method] = client;
  }
  use(router){
    router.routes.map((route)=>{
      this.addRoute(route);
    },this);
    for(const [key,value] of Object.entries(this.clients)){
      this.addClient(key,value);
    }
  }
  init(){
    let client;
    const _this = this;
    if(this.clients.pull){
      client = this.clients.pull;
      client.on('message',(msg)=> {
        try{
          const msgJson = JSON.parse(msg);
          _this.handleMessage('pull',msgJson);
          logger.info(`Message Received: ${msg}`);
        }catch(err){
          logger.error(err);
        }
      });
    }
  }
  addRoute(obj){
    _validateMethod(obj.method);
    _validatePath(obj.path);
    if(obj.method==='push' && !obj.handler){
      obj.handler = defaultPushHandler;
    }

    if(!_.isFunction(obj.handler)){
        throw new Error(`handler must be valid function.Found invalid for ${obj.path} of type ${typeof obj.handler}`);
    }
    if(!_.isFunction(obj.validator)){
        throw new Error(`validator must be valid function.Found invalid for ${obj.path} of type ${typeof obj.validator}`);
    }
    const fullPath=`${obj.method}:${obj.path}`;
    if(!!this.paths[fullPath]){
      if(!obj.opts.noWarning){
        logger.warn(`Path ${obj.path} already registered`)
      }
    }
    obj.pathRegex = new RegExp(`^${obj.path}$`);
    this.routes.push(obj);
    this.paths[fullPath] = true;
  }
  on(method,path,validator,handler,opts={}){
    this.addRoute({
      path,
      validator,
      handler,
      method,
      opts
    });
  }
  onPull(path,validator,handler,opts={}){
    this.addRoute({
      path,
      validator,
      handler,
      method:'pull',
      opts
    });
  }
  onSubscribe(path,validator,handler,opts={}){
    this.addRoute({
      path,
      validator,
      handler,
      method:'subscribe',
      opts
    });
  }
  onPush(path,validator,handler,opts={}){
    this.addRoute({
      path,
      validator,
      handler,
      method:'push',
      opts
    });
  }
  onPublish(path,validator,handler,opts={}){
    this.addRoute({
      path,
      validator,
      handler,
      method:'publish',
      opts
    });
  }
  _getValidRoutes(method,path){
    const candidates = this.routes.filter((route)=> route.method==method && route.pathRegex.test(path));
    return candidates;

  }
  handleMessage(method,req){
    _validatePath(req.path);
    const candidates = this._getValidRoutes(method,req.path);
    const mainCandidates = candidates.filter((candidate)=> !candidate.opts.middleware)
    if(!mainCandidates.length){
      throw new PubSubError(`No route registered for ${method}:${req.path}`);
    }

    const handlers = candidates.map((candidate)=> {
      return (callback) => {
        const reqObj = _.cloneDeep(req);
        const next = (err) => {
          if(err){ 
            callback(null,err); 
            return;
          }
          try{
            Promise.resolve(candidate.handler(reqObj.payload,reqObj)).then((val,err)=>callback(val,err)).catch((err)=>callback(null,err));
          }catch(err){
            callback(null,err);
          }
        };
        candidate.validator(reqObj,next);
      };
    });
    asynclib.parallel(handlers,(res,errors)=>{
      if(errors){
        errors.map((err)=>{
          if(err) logger.error(err);
        });
      }
    });
  }
  push(path,payload){
    _validatePath(path);
    const method = 'push';
    const client = this.clients.push;
    if(!client){
      throw new PubSubError(`No Client registered for pushing ${path} ${JSON.stringify(payload)}`)
    }
    const req = _createRequest(path,payload);
    const candidates = this._getValidRoutes(method,path);
    const mainCandidates = candidates.filter((candidate)=> !candidate.opts.middleware)
    if(!mainCandidates.length){
      throw new PubSubError(`No route registered for ${method}:${req.path}`);
    }
    //making validation sync here
    // save request corresponding to each handler coz they might have been
    // modified by schema validator
    let reqObjs = [];
    candidates.map((candidate)=>{
      const reqObj = _.cloneDeep(req);
      reqObjs.push(reqObj);
      const next = (err) => {
        if(err){ throw err};
      }
      candidate.validator(reqObj,next);
    });
    const handlers = candidates.map((candidate,index)=> {
      return (callback) => {
        const reqObj = reqObjs[index];
        const push = (req,err) => {
          if(err){ callback(null,err); return; }
          client.send(JSON.stringify(req));
          logger.info(`Push : ${JSON.stringify(req)} 200`)
        }
        try{
          Promise.resolve(candidate.handler(reqObj,push)).then((val,err)=>callback(val,err)).catch((err)=>callback(null,err));
        }catch(err){
          callback(null,err);
        }
      };
    });
    asynclib.parallel(handlers,(res,errors)=>{
      if(errors){
        errors.map((err)=>{
          if(err) logger.error(err);
        });
      }
    });
  }
}

module.exports = () => new PubSubRouter();
